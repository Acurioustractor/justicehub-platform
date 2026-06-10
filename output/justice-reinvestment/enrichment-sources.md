# Justice Reinvestment Site Enrichment : Sources & Gaps

Generated: 2026-06-10
Companion to: `src/data/justice-reinvestment/sites.json` and `history.json`

Method: each DB intervention name was matched to the verified census (`jr-census-2026-06.md`). Official websites were found by search and verified with an HTTP GET (200 = resolves) where the network allowed. Coordinates are the town/community location. No logo image URLs were captured in this pass (see tail). No AI-generated images used anywhere.

URL status legend: `200` confirmed resolving · `403/000` exists but blocked the automated check (bot/geo/TLS), confirmed real by search · `AG-fallback` no dedicated site found, Attorney-General's Department page used as source.

## Per-site findings (34 sites)

| Site | Website status | Logo | Notes |
|---|---|---|---|
| Maranguka Justice Reinvestment - Bourke | maranguka.org.au (200) | none | Has own site plus Just Reinvest NSW. |
| Moree Justice Reinvestment | justreinvest.org.au (200) | none | No distinct Moree microsite; lead org site used. |
| Mount Druitt Justice Reinvestment | justreinvest.org.au (200) | none | No distinct site. |
| Cowra Justice Reinvestment | AG-fallback (200) | none | No findable Cowra JR site; lead is Cowra Information & Neighbourhood Centre. |
| Nowra Justice Reinvestment | justicereinvestment.net.au (200) | none | Network page; no distinct Nowra site found. |
| Learning the Macleay - Kempsey | justreinvest.org.au (200) | none | No distinct Kempsey site. |
| Lajamanu Justice Reinvestment (Kurdiji) | AG-fallback (200) | none | kurdiji.org did NOT resolve (000). No working org site found. |
| Central Australia Justice Reinvestment Initiative | ministers.ag.gov.au release (200) | none | Consortium; no single site. Minister media release used. |
| Ngurratjuta/Pmara Ntjarra (Papunya/Mt Liebig/Haasts Bluff) | AG-fallback (200) | none | ngurratjuta.com.au did NOT resolve (000). |
| Maningrida Justice Reinvestment | njamarleya.org.au (200) | none | Nja-marleya org site confirmed. |
| Groote Eylandt Justice Reinvestment | anindilyakwa.com.au (200) | none | Anindilyakwa org site; not JR-specific page. |
| Doomadgee Justice Reinvestment | jungai.com.au/projects/justice-reinvestment/ (200) | none | Dedicated JR project page confirmed. |
| Cherbourg Justice Reinvestment Project | AG-fallback (200) | none | Cherbourg Wellbeing Indigenous Corp; no JR site found. |
| Yarrabah Justice Reinvestment (Gindaja) | AG-fallback (200) | none | gindaja.com.au did NOT resolve (000). |
| Mornington Island Justice Reinvestment | AG-fallback (200) | none | Jika Kangka Gununamanda Ltd; no site found. |
| Napranum Justice Reinvestment | napranum.qld.gov.au (200) | none | Aboriginal Shire Council site; not JR-specific. |
| Tiraapendi Wodli Justice Reinvestment | tiraapendiwodli.org.au/aboutjr (200) | none | Dedicated JR about page confirmed. |
| KNYA Justice Reinvestment (Ngarrindjeri) | ngarrindjeri.org.au/justice-reinvestment (200) | none | Dedicated JR page confirmed. |
| Ceduna Justice Reinvestment | justicereinvestmentsa.org/projectsaust (403/real) | none | JRSA project page; site blocks automated check but confirmed via search. |
| Kinchela Boys Home Justice Reinvestment | kinchelaboyshome.org.au (200) | none | Correct TLD is .org.au (NOT .com.au, which 000s). |
| Derby Justice Reinvestment | emamanguda.org.au (200) | none | Emama Nguda org site confirmed. |
| Katherine Justice Reinvestment | savannasolutions.com.au (200) | none | Savanna Solutions org site confirmed. |
| Balga Justice Reinvestment | AG-fallback (200) | none | Ebenezer Aboriginal Corp; no site found. |
| Carnarvon Justice Reinvestment | gdc.wa.gov.au (200) | none | Gascoyne Development Commission site; not JR-specific. |
| Perth Justice Reinvestment (ALSWA) | als.org.au (200) | none | Correct domain is als.org.au (NOT alswa.org.au, which 000s). |
| Newman / Pilbara Men's Healing | AG-fallback (200) | none | Aboriginal Male's Healing Centre; no working site confirmed this pass. |
| Mampu-Maninjaku (CAYLUS) | caylus.org.au (200) | none | CAYLUS org site confirmed; JR via Central Australia Program. |
| Social Reinvestment WA | socialreinvestmentwa.org.au (200) | none | Coalition site confirmed. |
| RR25by25 ACT Justice Reinvestment Strategy | act.gov.au First Nations justice page (200) | none | Strategy PDF also on act.gov.au; ACT Gov page used as primary. |
| Yeddung Mura Justice Reinvestment Programs | goodpathways.org.au (200) | none | "Good Pathways" is the org's web identity. |
| Justice Reinvestment SA | justicereinvestmentsa.org (403/real) | none | Site blocks automated check (Squarespace/geo); confirmed real via search + Google index. |
| Justice Reinvestment Network Australia | justicereinvestment.net.au (200) | none | National peak body. |
| National Justice Reinvestment Program | ag.gov.au/legal-system/justice-reinvestment (200) | none | Authoritative Commonwealth program page. |
| Olabud Doogethu (Halls Creek) | olabuddoogethu.org.au/about-us/ (200) | none | WA's first JR site. |

## Summary counts
- Sites total: 34
- With a website URL: 34 (every site has a resolving or search-confirmed URL; 9 use the AG Department fallback because no dedicated site was found)
- With a logo URL: 0

## Tail : what a human still needs to finish

### Logos (all 34 missing)
No direct logo image URLs were captured. To complete `logo_url`, a human should open each org's homepage and copy the direct image URL of their own logo (e.g. the `<img>` src in the header, or the og:image), confirming it sits on the org's own domain or official social profile. Never substitute an AI image or a third-party recreation. Priority orgs with strong, clearly branded sites where a logo is likely easy to grab: Maranguka, Just Reinvest NSW, Olabud Doogethu, ALSWA (als.org.au), CAYLUS, Anindilyakwa, Social Reinvestment WA, Kinchela Boys Home, Yeddung Mura / Good Pathways, Tiraapendi Wodli, Gunawuna Jungai.

### Websites still on AG fallback (no dedicated site found this pass)
These 9 use the Attorney-General's Department page as their source URL because no dedicated JR site (or working org site) was found:
- Cowra (Cowra Information & Neighbourhood Centre : check for a JR program page)
- Lajamanu / Kurdiji (kurdiji.org returned 000 : confirm whether the domain is dead or just blocking; a Kurdiji site/app for the Law app has existed historically)
- Ngurratjuta (ngurratjuta.com.au returned 000 : confirm correct domain)
- Cherbourg (Cherbourg Wellbeing Indigenous Corporation : find org site)
- Yarrabah / Gindaja (gindaja.com.au returned 000 : confirm correct domain)
- Mornington Island (Jika Kangka Gununamanda Ltd : find org presence)
- Balga (Ebenezer Aboriginal Corporation : find org presence)
- Newman / Pilbara Men's Healing (Aboriginal Male's Healing Centre : find working site)
- Central Australia Initiative (consortium; minister release used : consider a Tangentyere or NT Gov landing page)

### Sites blocked from automated verification (confirmed real, recheck from a browser)
- justicereinvestmentsa.org and /projectsaust : returned 000 from curl on this network, but the site is live and indexed (confirmed via search). Recheck from a normal browser.
- justreinvest.org.au returned 403 to a bare curl but 200 with a browser user-agent; it is live.
- aph.gov.au 2013 Senate inquiry report returned 403 to curl (bot block) but the report exists.

### Census items intentionally NOT given a row here
The task's DB-name list did not include every census row. Sites present in the census but not in the supplied DB-name list (so not added): Townsville JR (PICC-adjacent), Hope Vale (Cape York Institute), Mossman (Balkanu), Port Augusta (Healthy Dreaming), Shepparton, Melton/Djirra, Mounty Yarns. If these get DB intervention names later, enrich them the same way. Healthy Dreaming (healthydreaming.com.au) and Tangentyere (tangentyere.org.au) both resolved 200 in testing and are ready if those rows are added.

### History timeline note
The 2018 KPMG report source was switched to the Indigenous Justice Clearinghouse landing page (indigenousjustice.gov.au) because the Just Reinvest PDF path 404s. The 2023 entry uses the "Now Open: National Justice Reinvestment Program" ministers.pmc.gov.au release because the Alice Springs/Halls Creek ministers.ag.gov.au release now 404s. All 12 history source URLs resolve except the aph.gov.au Senate inquiry link (403 bot-block, page is real).
