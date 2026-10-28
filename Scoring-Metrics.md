# Metrics used in evaluating public solicitation posting websites of states and territories

For each listed metric it (1) explains what the metric is, (2) explains how the metric is scored, and (3) explains why the metric is important.

Throughout this document, the term “solicitation posting” is used to describe the process of public advertising of a contracting opportunity. There are many other terms, including notices, bids, opportunities, tenders, proposals, and a series of acronyms like ITB, IFB, RFQ, RFI, RFP, RFS, ITN, RFA, RFR, etc. that are generally meant to be captured under this term.

This evaluation only considers information that is publicly available, meaning that it can be accessed by a member of the public without registration. We feel that procurement information is most useful when it is broadly and easily accessible. Potential vendors are not the only users of information from solicitation posting notices. Governments often look to each other for examples of similar work, and it benefits the broader government procurement community if information is more easily accessible. 

The total score available from all metrics is 100 points.

### State web design system in use

A web design system (WDS) is a library of user interface components and visual style guides for websites operated by a government. The [U.S. Web Design System (USWDS)](https://designsystem.digital.gov/) is an example of a web design system. The [Delaware bids website](https://mmp.delaware.gov/Bids/) is an example of a solicitation posting notices list website using a state WDS.

This is a yes-or-no binary metric worth five (5) points. Yes indicates that a government both has a WDS and is using that WDS on the website where notices are listed.

Use of a web design system helps create better services. A good WDS makes government websites more consistent which makes it easier for visitors to navigate across multiple government services during a process. This matters for something like vendor registration where they may need to interact with websites for a small business office and a controller’s office in addition to a purchasing office.

Ideally, every state has a web design system implemented, so that collaboratively developed, open source, or commercially acquired tools can be easily included without changing the overall user experience.  

### Data standard is published	

A published data standard is a public record of the fields and information that a government will collect and publish related to a government program or process. In this instance, we are specifically referring to a data standard for solicitation postings. A government can create their own data standard and publish it somewhere, or preferably they adopt the [Open Contracting Data Standard (OCDS)](https://www.open-contracting.org/data-standard/). The [UK’s find a tender service](https://www.find-tender.service.gov.uk/Search/Results) is an example of the OCDS in use.

This is a yes-or-no binary metric worth five (5) points. Yes indicates that a government has adopted the OCDS or publishes their own data standard related to solicitation postings.

Published data standards make data more useful to researchers and efforts to match up data from multiple sources. This matters in making software applications modular and interoperable with other related software, necessary for automating processes and improving service delivery. 

Ideally, every government procurement agency adopts a universal standard like OCDS and flows that requirement down to their vendor systems, assisting the entire community in sharing information, comparing experiences, improving vendor performance, minimizing switching costs, and enabling data sharing. 

### Solicitation posting notices list has a direct URL (10 pts)	

This metric is focused specifically on the webpage for the notices list for active competitive solicitation postings (like RFPs). When a webpage has a direct URL it can be shared easily with other people.

This is a yes-or-no binary metric worth ten (10) points. Yes indicates that a government (or a vendor on their behalf) maintains a public website where their current competitive solicitation posting notices are listed and that the URL of that website leads directly to the list without additional navigation by the user.  
   
Public notice of intended government actions is an important part of how a government ensures actions are transparent, trustworthy, and defensible. Procurement is built on the idea of full and open competition, where all responsible sources will be considered. An easily sharable, bookmarkable, and even crawlable notices list makes it easier for the opportunity to be discovered by new vendors. This metric is given extra weight because competition and vendor discovery is so vital to the goals of a notices list.

Ideally, every government’s notices list website URL is something easy like `state.gov/solicitations` so that government contracting opportunities are as easy as possible for potential vendors and the public to find.

### Includes local listings	

This metric looks at the solicitation posting notices list webpage and whether the notices included in the lists are exclusive to the executive agencies of a state government or if they also include notices from local jurisdictions like cities, counties, and districts. This metric examines a notices list webpage whether it has a dedicated URL or not.

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the public facing notices list website maintained by the state government includes notices from local jurisdictions.

Vendors with the potential to provide a good or service often would like to provide it to all levels of government. This could mean visiting multiple websites, with different user experiences, to discover potential opportunities. A joined up service, where notices about opportunities from multiple public agencies are all available, can increase vendor participation and competition on government projects by decreasing the barriers to discovery and participation.

Ideally, every state level government operates a notices list website that performs at a level where local governments choose to participate in the system for the benefits that using it provides.

### Data export of notices list	

This metric looks at the solicitation posting notices list webpage to see if there is an easily accessible method of exporting the data included in the notices list for ease of collection by prospective vendors and interested third parties. 

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the notices list has an easily found export or download method that allows the user to download the information included in the list in a usable data format like JSON, CSV, XLSX, or similar. A print button or a PDF of the information does not meet this metric.

Vendors work with multiple customers, both public and private, and benefit from being able to interact with the information in a method of their own choosing. Additionally, third-party aggregators and small business matchmaking services can better amplify government contracting opportunities when data is easily available for export.

Ideally, every state government would provide direct machine readable access to notices list data, so that other governments, researchers, vendors, the public, and even AI agents can easily access and use it.

### Lighthouse performance for the notices list

[Google Lighthouse](https://developer.chrome.com/docs/lighthouse) is an open source, automated tool used to audit web apps. This metric looks at the [Lighthouse performance score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) of the solicitation posting notices list webpage. 

This is a graded metric worth five (5) points derived from the Lighthouse performance score. Performance is scored on a scale of 0 to 100, with 90 to 100 considered good. A score of 90 or better is given five (5), four (4) points for 80-89, three (3) points for 70-79, two (2) points for 60-69, and one (1) point for 50-59. A score below 50 receives no points.   

This metric is dependent on the notices list having a direct URL. If it does not have a direct URL it could not be scored by Google Lighthouse and received a zero (0). Each site was tested manually using the features built into Google Chrome. 

Google Lighthouse is a widely used and trusted tool for auditing and evaluating websites. Good performance is important to giving users a positive experience that loads quickly and renders correctly. 

### Lighthouse accessibility for the notices list

[Google Lighthouse](https://developer.chrome.com/docs/lighthouse) is an open source, automated tool used to audit web apps. This metric looks at the Lighthouse accessibility score of the solicitation posting notices list webpage. 

This is a graded metric worth five (5) points derived from the Lighthouse accessibility score. Accessibility is scored on a scale of 0 to 100, with 90 to 100 considered good. A score of 90 or better is given five (5), four (4) points for 80-89, three (3) points for 70-79, two (2) points for 60-69, and one (1) point for 50-59. A score below 50 receives no points.   

This metric is dependent on the notices list having a direct URL. If it does not have a direct URL it could not be scored by Google Lighthouse and received a zero (0). Each site was tested manually using the features built into Google Chrome. 

Google Lighthouse is a widely used and trusted tool for auditing and evaluating websites. Good accessibility ensures that everyone, including people who use screen readers, keyboard navigation, or other assistive technology, can find and use public information about government contracting opportunities. 

### Direct URL to an individual posting (25 pts)

This metric is focused specifically on the webpage for an individual solicitation posting (like an ITB or RFP). When a webpage has a direct URL it can be shared easily with other people, scraped by AI or other information services, and generally circulated more easily.

This is a yes-or-no binary metric worth twenty-five (25) points. Yes indicates that a government (or a vendor on their behalf) maintains a public webpage for an individual solicitation posting notice and that the URL of that webpage leads directly to the posting without additional navigation by the user. This is the most important metric, worth 25% of the available points.

This metric receives the most weight because for government procurement, advertising the solicitation publicly is the underlying thing that demonstrates it is fair. Giving interested persons equal opportunity to compete for the government’s business is the foundation of public procurement. The point of the notice is to be distributed and discovered, so it should be as easy as possible to do so. 

Governments often pay for advertising their opportunities and vendors pay third-party services to find and aggregate opportunities. Both of those are workarounds for governments not making that information easily available. Everyone is using a service for the first time at some point, and the service should be as usable for them as a returning vendor.   
   
Gone are the days where potential vendors find solicitation opportunities in the local newspaper’s public notices section, governments can and should make information directly available online. Public notice of intended government actions is an important part of how a government ensures actions are transparent, trustworthy, and defensible. Procurement is built on the idea of full and open competition, where all responsible sources will be considered. An easily sharable, bookmarkable, and even crawlable notice makes it easier for the opportunity to be discovered by new vendors. Public notice of a solicitation is often a legal requirement, where the intended purpose is the transparency and advertising of the government action being considered. An easily found, easily shared URL for a specific opportunity also helps other governments identify best practices and share information. 

Ideally, every individual solicitation posting has a URL that is something easy like `state.gov/solicitations/RFP-2026-17-case-management-software` so that government contracting opportunities are as easy as possible for potential vendors and the public to find. Additionally, we would like to see public digital records of solicitations continue to exist, in alignment with government records retention schedules, with links to related records like award information, contract records, and payment records that are also public; but documenting that is beyond the scope of this project.

### Individual posting page

This metric is focused specifically on the existence of a webpage for an individual solicitation posting (like an ITB or RFP), regardless of whether it has a dedicated URL or not. 

This is a yes-or-no binary metric worth five (5) points. Yes indicates that a government (or a vendor on their behalf) maintains a public webpage for an individual posting. A yes on this metric includes pages that do not have an individual URL but can be navigated to manually by a user. A webpage that requires registration and login to access a posting does not meet this metric. 

This further differentiates those agencies who do not have a direct URL, but do have an individual public posting page for solicitations. Agencies that do not meet this metric are smaller populations with less digital services generally or agencies that have chosen to put the information behind a registration and login process. Putting the individual posting page behind a registration process creates an unnecessary barrier for small or new vendors to discover an opportunity, further entrenching large and existing vendors with the resources and knowledge to navigate poorly designed services.

### Contact name and email

This metric looks at content on an individual posting webpage and determines if the information listed includes a name and email address as the point of contact for that solicitation. 

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the webpage for an individual posting includes the name and email address of the person responsible for conducting a solicitation. A posting must include both a name and an email address.

It should be easy to get human assistance. Procurement processes often require that vendors communicate with a single point of contact during an active solicitation for reasons of equality and fairness. The government must uphold their side of that requirement by clearly providing that single point of contact. Email is the preferred method of communication for this purpose because it is in writing and a commonly used tool, but providing a phone number is encouraged as well. The person's name is necessary to create accountability for government actions and ensure inherently governmental functions are performed by qualified government officials. The public, media, researchers, and other governments may have a need to contact the government too. 

### Project summary	

This metric looks at content on an individual posting webpage and determines if the information listed includes a simple project summary that provides enough information for a potential vendor to determine if the solicitation is targeted at them and worth reviewing in full.  

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the webpage for an individual posting includes a project summary with sufficient detail. The summary should include plain language, not abbreviated words or acronyms.  

A good service should have no dead ends, the service should consider the needs of the unqualified users as well. The goal of a solicitation is to identify qualified vendors and encourage them to respond. In accomplishing that goal the inverse is also intended, to identify unqualified vendors and discourage them from responding. By providing clear information up front about what a solicitation intended to accomplish, vendors who are targeted should know right away they should be interested and vendors who are not should not spend any additional time making that determination.

A plain language description of what the agency needs—directly on the webpage, not buried in the attachments—is ideal for letting potential vendors determine quickly whether they are interested.

### Data export of posting

This metric looks at the functionality of an individual posting webpage and determines if the service is capable of exporting the information included on the page, so that it can be consumed as data by another service, artificial intelligence, or various other use cases.

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the webpage for an individual posting includes an easily found export or download method that allows the user to download the information included in the posting in a usable data format like JSON, CSV, XLSX, or similar. A print button or a PDF of the information does not meet this metric.

Vendors work with multiple customers, both public and private, and benefit from being able to interact with the information in a method of their own choosing. Additionally, third-party aggregators and small business matchmaking services can better amplify government contracting opportunities when data is easily available for export. 

Ideally, every state government would provide direct machine readable access to individual solicitation notices following consistent data standards like the [Open Contracting Data Standard (OCDS)](https://standard.open-contracting.org/latest/en/), so that other governments, researchers, vendors, the public, and even AI agents can easily access, use, and compare it.

### Documents without registration

This metric looks at whether the state provides access to the full solicitation documents publicly, without requiring the user to register for an account or log in to a system in order to view or download solicitation documents.

This is a yes-or-no binary metric worth five (5) points. Yes indicates that the website includes the ability to access, view, and/or download the entirety of a solicitation, including all attachments or addenda. A website that does not include individual posting pages can still meet this requirement if the notices list links directly to attachments. A website that requires registration to view attachments does not meet this standard. 

Government solicitations are active public records that should be easily accessible. Requiring registration assumes that the only audience is existing registered vendors. Other governments, the public, and researchers benefit from easier access to solicitation documents as well. More transparency increases information in the marketplace, which benefits all governments as buyers of similar products and services in sharing information, developing standards, and negotiating on behalf of the public. 

Ideally, governments will modernize their solicitation processes and templates to include more of the project and contact information in a standard machine readable format and phase out the use of PDFs and Word files that do not meet accessible standards as the primary packaging for government solicitations. 

### Lighthouse performance for the posting page

[Google Lighthouse](https://developer.chrome.com/docs/lighthouse) is an open source, automated tool used to audit web apps. This metric looks at the [Lighthouse performance score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) of an individual solicitation posting notice webpage. 

This is a graded metric worth five (5) points derived from the Lighthouse performance score. Performance is scored on a scale of 0 to 100, with 90 to 100 considered good. A score of 90 or better is given five (5), four (4) points for 80-89, three (3) points for 70-79, two (2) points for 60-69, and one (1) point for 50-59. A score below 50 receives no points.   

This metric is dependent on an individual solicitation posting having a direct URL. If it does not have a direct URL it could not be scored by Google Lighthouse and received a zero (0). Each site was tested manually using the features built into Google Chrome. 

Google Lighthouse is a widely used and trusted tool for auditing and evaluating websites. Good performance is important to giving users a positive experience that loads quickly and renders correctly. 

### Lighthouse accessibility for the posting page

[Google Lighthouse](https://developer.chrome.com/docs/lighthouse) is an open source, automated tool used to audit web apps. This metric looks at the Lighthouse accessibility score of an individual solicitation posting notice webpage. 

This is a graded metric worth five (5) points derived from the Lighthouse accessibility score. Accessibility is scored on a scale of 0 to 100, with 90 to 100 considered good. A score of 90 or better is given five (5), four (4) points for 80-89, three (3) points for 70-79, two (2) points for 60-69, and one (1) point for 50-59. A score below 50 receives no points.   

This metric is dependent on an individual solicitation posting having a direct URL. If it does not have a direct URL it could not be scored by Google Lighthouse and received a zero (0). Each site was tested manually using the features built into Google Chrome. 

Google Lighthouse is a widely used and trusted tool for auditing and evaluating websites. Good accessibility ensures that everyone, including people who use screen readers, keyboard navigation, or other assistive technology, can find and use public information about government contracting opportunities. 
