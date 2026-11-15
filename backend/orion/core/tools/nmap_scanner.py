"""
Orion Security Platform — Nmap Service/Port Scanner Wrapper.

PURPOSE: Runs Nmap (when installed) against the sanitized target's hostname
and parses its XML output into VulnerabilityItem findings — one per open
port, with elevated severity for ports that are historically high-risk
(plaintext protocols, common unauthenticated admin surfaces, etc.).

If the `nmap` binary isn't available on the host, falls back to a safe,
pure-Python TCP connect scan over the same "interesting ports" list so a
result is always returned rather than failing the whole pipeline — the
orchestrator never has to know which path was taken.
"""
from __future__ import annotations

import asyncio
import logging
import shutil
import xml.etree.ElementTree as ET
from typing import Any, Optional

from orion.core.schemas import SanitizedTarget, VulnerabilityItem
from orion.core.tools.base_tool import ToolInterface

logger = logging.getLogger(__name__)

# Ports worth a connect-scan fallback when the real `nmap` binary isn't
# installed — common service ports plus the high-risk ones below.
FALLBACK_PORTS = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 1433,
                   3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017]

# Ports that are flagged above plain "open port" info level because the
# service behind them is historically dangerous to expose, regardless of
# which product/version is actually running.
RISKY_PORT_SEVERITY: dict[int, tuple[str, str]] = {
    21: ("medium", "FTP transmits credentials and data in plaintext; anyone on the network path can capture them."),
    23: ("high", "Telnet transmits everything — including credentials — in plaintext and has no integrity protection."),
    139: ("high", "NetBIOS/SMB has been the entry point for major worms (e.g. WannaCry/EternalBlue) when exposed to untrusted networks."),
    445: ("high", "SMB has been the entry point for major worms (e.g. WannaCry/EternalBlue) when exposed to untrusted networks."),
    3389: ("medium", "RDP exposed to the internet is a common target for credential-stuffing and brute-force campaigns."),
    5900: ("high", "VNC often ships with weak or no authentication and gives full remote desktop control if exposed."),
    6379: ("high", "Redis has no authentication by default and is routinely found open and unauthenticated on the internet."),
    9200: ("high", "Elasticsearch has no authentication by default on older versions and commonly leaks entire databases when exposed."),
    27017: ("high", "MongoDB has no authentication by default on older versions and commonly leaks entire databases when exposed."),
}


class NmapScanner(ToolInterface):
    name = "nmap"

    async def _run_impl(
        self,
        target: SanitizedTarget,
        options: dict[str, Any],
    ) -> list[VulnerabilityItem]:
        nmap_bin = shutil.which("nmap")

        if nmap_bin:
            cmd = [
                nmap_bin,
                "-oX", "-",         # XML to stdout
                "-T4",               # faster timing template
                "--top-ports", "100",
                "-Pn",                # skip host discovery — we already resolved the host
                target.hostname,
            ]
            try:
                returncode, stdout, stderr = await self.run_subprocess(cmd, timeout=self.timeout)
                if stdout.strip():
                    return await self.parse_output(stdout, target)
                logger.warning("nmap produced no output (rc=%s): %s", returncode, stderr[:300])
            except Exception as e:  # noqa: BLE001
                logger.warning("nmap CLI execution failed, falling back to connect scan: %s", e)

        # Fallback: pure-Python TCP connect scan — no nmap binary available.
        return await self._connect_scan_fallback(target)

    async def _connect_scan_fallback(self, target: SanitizedTarget) -> list[VulnerabilityItem]:
        """Safe TCP connect scan (no raw packets) over a fixed port list."""
        vulns: list[VulnerabilityItem] = []

        async def probe(port: int) -> Optional[int]:
            try:
                _, writer = await asyncio.wait_for(
                    asyncio.open_connection(target.hostname, port), timeout=2.0
                )
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:  # noqa: BLE001
                    pass
                return port
            except Exception:  # noqa: BLE001
                return None

        results = await asyncio.gather(*(probe(p) for p in FALLBACK_PORTS))
        for port in sorted(p for p in results if p is not None):
            vulns.append(self._make_port_finding(port, "tcp", service=_guess_service(port), target=target))
        return vulns

    def _make_port_finding(
        self,
        port: int,
        protocol: str,
        *,
        service: str,
        target: SanitizedTarget,
    ) -> VulnerabilityItem:
        risky = RISKY_PORT_SEVERITY.get(port)
        if risky:
            severity, reason = risky
            description = (
                f"Port {port}/{protocol} is open and running {service}. {reason}"
            )
            remediation = [
                "Restrict access to this port to a VPN, bastion host, or allow-listed IP ranges.",
                "Disable the service entirely if it isn't required for this host's role.",
            ]
        else:
            severity, description = "info", (
                f"Port {port}/{protocol} is open and running {service}. "
                "Not dangerous by itself, but every open port is additional attack surface."
            )
            remediation = ["Close the port if the service isn't required, or firewall it to trusted sources only."]

        return self.make_vuln(
            title=f"Open Port {port}/{protocol}: {service}",
            severity=severity,
            service=service,
            port=port,
            description=description,
            remediation_steps=remediation,
        )

    async def parse_output(self, raw_output: str, target: SanitizedTarget) -> list[VulnerabilityItem]:
        vulns: list[VulnerabilityItem] = []
        try:
            root = ET.fromstring(raw_output)
        except ET.ParseError as e:
            logger.warning("nmap: failed to parse XML output: %s", e)
            return vulns

        for host in root.findall("host"):
            ports_el = host.find("ports")
            if ports_el is None:
                continue
            for port_el in ports_el.findall("port"):
                state_el = port_el.find("state")
                if state_el is None or state_el.get("state") != "open":
                    continue

                protocol = port_el.get("protocol", "tcp")
                try:
                    port_num = int(port_el.get("portid", "0"))
                except ValueError:
                    continue

                service_el = port_el.find("service")
                service = _format_service(service_el, fallback=_guess_service(port_num))

                vulns.append(self._make_port_finding(port_num, protocol, service=service, target=target))

        return vulns


def _format_service(service_el: Optional[ET.Element], *, fallback: str) -> str:
    if service_el is None:
        return fallback
    name = service_el.get("name") or fallback
    product = service_el.get("product")
    version = service_el.get("version")
    if product:
        return f"{name} ({product}{(' ' + version) if version else ''})"
    return name


def _guess_service(port: int) -> str:
    return {
        21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "domain",
        80: "http", 110: "pop3", 139: "netbios-ssn", 143: "imap",
        443: "https", 445: "microsoft-ds", 1433: "ms-sql-s", 3306: "mysql",
        3389: "ms-wbt-server", 5432: "postgresql", 5900: "vnc",
        6379: "redis", 8080: "http-proxy", 8443: "https-alt",
        9200: "elasticsearch", 27017: "mongodb",
    }.get(port, "unknown")
