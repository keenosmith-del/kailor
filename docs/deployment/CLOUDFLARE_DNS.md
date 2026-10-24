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

No apex AAAA, CAA, DS or DNSKEY answers were observed. The Cloudflare dashboard also shows DNSSEC disabled; it was left unchanged. The published DKIM selector is `zoho._domainkey`, not `zmail._domainkey`. Recheck DNSSEC at the registrar immediately before migration; do not leave an old DS record pointing at different signing keys.

## Pending zone preparation

The owner added the Cloudflare zone during setup. Verified zone ID: `dc881c3b3913a810e193edbd09c84d7a`, status `pending`; assigned nameservers: `gemma.ns.cloudflare.com`, `sevki.ns.cloudflare.com`. These are future delegation destinations, not an instruction to change them now. The Free Website plan and pending status were verified through the API. Wrangler OAuth has zone read access only; DNS-record listing returns HTTP 403, so the signed-in dashboard was used for record inspection and redirect preparation. Obtain the complete current provider zone export and reconcile all records before changing delegation. Preserve all MX/TXT records above, including the full DKIM public key, plus any additional subdomains, service and verification records in that export. Mail and TXT records must remain DNS-only. Do not proxy mail hostnames.

The pending zone is in account `f81e057fd638ae3e93a1aa192f7a49dc`. Keep the current registrar delegation and existing website records during preparation. The signed-in dashboard shows exactly nine imported records: the apex A, www CNAME, three Zoho MX and four TXT records listed above. All content and MX priorities match the public inventory, including the full DKIM key; all mail/TXT records are DNS-only. Imported TTLs are Auto. Apex and www are proxied, still pointing at the existing website. No DNS record edits were necessary or performed. This proves the known inventory was imported; it does not establish that the original provider has no other subdomains.

A Single Redirect was saved as a **disabled draft**, rule ID `cab118018e344430b555869382056a3f`, name `www to canonical apex — pending cutover`. Match: `(http.host eq "www.kailor.co.za")`. Dynamic destination: `concat("https://kailor.co.za", http.request.uri.path)`. Status 301, preserve query string enabled. This covers both HTTP and HTTPS and all paths for the exact www hostname. The saved details and disabled toggle were verified in the dashboard.

Always Use HTTPS was enabled for the pending zone. Universal SSL is enabled, but the certificate table is empty while the zone is pending. The owner explicitly approved minimum TLS 1.2 and Full (strict) after automatic approval review requested specific compatibility approval. These settings were then applied and verified in the dashboard. TLS 1.3 remains enabled. No paid certificate feature was activated.

## After preview verification and explicit activation approval

1. Attach `kailor.co.za` as a Pages custom domain for project `kailor`, and follow the provider validation flow. The apex Pages destination is `kailor.pages.dev`; use the Pages-generated proxied CNAME with apex flattening. Replace the old apex A `169.239.219.58` only as part of the approved cutover.
2. Enable the already-saved Single Redirect draft only as part of the approved cutover. Keep its exact www hostname match, path-preserving dynamic target, 301 status and preserve-query setting.
3. Keep www proxied so the zone redirect runs; the existing www CNAME to the apex can remain with the Single Redirect. Confirm Universal SSL covers apex and www before accepting HTTPS traffic. Always Use HTTPS is already enabled for future zone activation. Do not put hostname redirects in Pages `_redirects`, which does not support domain sources.
4. Reconcile the complete zone and verify every Zoho MX, SPF, DKIM, DMARC and verification record again. Change the four current registrar nameservers only to the two exact Cloudflare-assigned nameservers. No such change is authorised yet.
5. Verify nameserver propagation, apex HTTPS, www path/query redirects, canonical metadata, and Zoho mail delivery/authentication. Enable DNSSEC only through the appropriate new Cloudflare/registrar DS flow after delegation is stable.

The Pages preview remains available independently of these steps. The zone exists in pending state. The www redirect exists but is disabled. No custom domain attachment, certificate issuance for that domain, redirect activation or nameserver cutover is claimed as completed in this document.

## Rollback

Retain the complete provider export, the current nameservers above, and old hosting during cutover. Before delegation changes, rollback simply leaves the current domain untouched. After cutover, restoring website DNS or previous nameservers requires owner approval and may be delayed by cached DNS. Do not remove Zoho records during rollback.

Provider references: [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [www redirect](https://developers.cloudflare.com/pages/how-to/www-redirect/).
