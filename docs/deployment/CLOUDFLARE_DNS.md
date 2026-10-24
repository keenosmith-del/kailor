# DNS inventory and pending Cloudflare cutover

Observed publicly on 24 October 2026 (Africa/Johannesburg). This is a targeted public lookup, not a complete zone export. Authoritative DNS is currently domains.co.za; no existing records have been changed.

## Existing records to retain until approval

| Name                           | Type  | TTL   | Value                                                                                                                                                                                                                                        |
| ------------------------------ | ----- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kailor.co.za`                 | NS    | 21600 | `ns2.tld-ns.com.`                                                                                                                                                                                                                            |
| `kailor.co.za`                 | NS    | 21600 | `ns3.tld-ns.net.`                                                                                                                                                                                                                            |
| `kailor.co.za`                 | NS    | 21600 | `ns4.tld-ns.com.`                                                                                                                                                                                                                            |
| `kailor.co.za`                 | NS    | 21600 | `ns1.tld-ns.net.`                                                                                                                                                                                                                            |
| `kailor.co.za`                 | A     | 600   | `169.239.219.58`                                                                                                                                                                                                                             |
| `www.kailor.co.za`             | CNAME | 600   | `kailor.co.za.`                                                                                                                                                                                                                              |
| `kailor.co.za`                 | MX    | 300   | `20 mx2.zoho.com.`                                                                                                                                                                                                                           |
| `kailor.co.za`                 | MX    | 300   | `10 mx.zoho.com.`                                                                                                                                                                                                                            |
| `kailor.co.za`                 | MX    | 300   | `50 mx3.zoho.com.`                                                                                                                                                                                                                           |
| `kailor.co.za`                 | TXT   | 300   | `zoho-verification=zb77334209.zmverify.zoho.com`                                                                                                                                                                                             |
| `kailor.co.za`                 | TXT   | 300   | `v=spf1 include:zohomail.com ~all`                                                                                                                                                                                                           |
| `_dmarc.kailor.co.za`          | TXT   | 300   | `v=DMARC1; p=none; rua=mailto:keenosmith@kailor.co.za; ruf=mailto:keenosmith@kailor.co.za; sp=none; adkim=r; aspf=r; pct=100`                                                                                                                |
| `zoho._domainkey.kailor.co.za` | TXT   | 300   | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCxOwh4SXGAZwvyO60gCR94sQjtAFgb0pinkGAkC05JiaIZJzPWxEp+Nebj88M08lrFMBO4keATI04N4PX824HfIhLdbvBrbIkqegRxWkFeKAknRsg2Z02/N/i/kobinCl/eePCF+zCKsVP2X5Ac2rzd6+3J2QEnz/YhHMbDYMMuQIDAQAB` |

No apex AAAA, CAA, DS or DNSKEY answers were observed. The published DKIM selector is `zoho._domainkey`, not `zmail._domainkey`. Recheck DNSSEC at the registrar immediately before migration; do not leave an old DS record pointing at different signing keys.

## Pending zone preparation

The owner added the Cloudflare zone during setup. Verified zone ID: `dc881c3b3913a810e193edbd09c84d7a`, status `pending`; assigned nameservers: `gemma.ns.cloudflare.com`, `sevki.ns.cloudflare.com`. These are future delegation destinations, not an instruction to change them now. Wrangler OAuth has zone read access only; DNS-record listing returns HTTP 403. Obtain the complete current provider zone export and reconcile all records before changing delegation. Preserve all MX/TXT records above, including the full DKIM public key, plus any additional subdomains, service and verification records in that export. Mail and TXT records must remain DNS-only. Do not proxy mail hostnames.

The pending zone is in account `f81e057fd638ae3e93a1aa192f7a49dc`. Keep the current registrar delegation and existing website records during preparation. Zone records, plan, automatic import completeness and pending redirect settings still need inspection through an authorised DNS interface. The Codex browser panel requires its own Cloudflare sign-in before that inspection can continue.

## After preview verification and explicit activation approval

1. Attach `kailor.co.za` as a Pages custom domain for project `kailor`, and follow the provider validation flow. The apex Pages destination is `kailor.pages.dev`; use the Pages-generated proxied CNAME with apex flattening. Replace the old apex A `169.239.219.58` only as part of the approved cutover.
2. Prepare a Cloudflare Bulk Redirect: source `www.kailor.co.za/`, target `https://kailor.co.za/`, status 301, preserve query string, subpath matching and preserve path suffix enabled. Enable include subdomains as in the official Pages www redirect recipe. The source must cover both HTTP and HTTPS.
3. Replace the existing www CNAME with proxied A `192.0.2.1` for the redirect-only hostname, as documented by Cloudflare. Confirm Universal SSL covers apex and www before accepting HTTPS traffic. Enforce HTTPS through Cloudflare. Do not put hostname redirects in Pages `_redirects`, which does not support domain sources.
4. Reconcile the complete zone and verify every Zoho MX, SPF, DKIM, DMARC and verification record again. Change the four current registrar nameservers only to the two exact Cloudflare-assigned nameservers. No such change is authorised yet.
5. Verify nameserver propagation, apex HTTPS, www path/query redirects, canonical metadata, and Zoho mail delivery/authentication. Enable DNSSEC only through the appropriate new Cloudflare/registrar DS flow after delegation is stable.

The Pages preview remains available independently of these steps. The zone exists in pending state. No custom domain attachment, certificate issuance for that domain, redirect rule or nameserver cutover is claimed as completed in this document.

## Rollback

Retain the complete provider export, the current nameservers above, and old hosting during cutover. Before delegation changes, rollback simply leaves the current domain untouched. After cutover, restoring website DNS or previous nameservers requires owner approval and may be delayed by cached DNS. Do not remove Zoho records during rollback.

Provider references: [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [www redirect](https://developers.cloudflare.com/pages/how-to/www-redirect/).
