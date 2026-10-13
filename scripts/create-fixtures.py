import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
rows=[
('nails','Independent nail services','beauty','Social portfolio with direct-message bookings',['credibility','booking'],['instagram','whatsapp'],['website','email','booking']),
('salon','Barbers and salons','salon','Appointment-led services with repeat customers',['booking'],['whatsapp'],['booking','website']),
('seller','Small online seller','retail','Products sold through social messages',['credibility','custom'],['instagram'],['website','payment']),
('food','Home-based food business','food','Pre-orders and delivery arranged manually',['booking','credibility'],['whatsapp'],['website','booking']),
('trades','Independent tradesperson','trades','Local service enquiries and quotes',['credibility','invoices'],['whatsapp'],['website','automation']),
('creative','Creative professional','creative','Selected work needs a coherent showcase',['credibility'],['instagram'],['portfolio']),
('freelancer','Freelancer','freelance','Project enquiries and manual administration',['invoices','credibility'],['spreadsheets'],['portfolio','automation']),
('consultant','Independent consultant','consulting','Expertise and enquiries need clear presentation',['credibility','booking'],['email'],['website','booking']),
('teacher','Teacher preparation','education','Recurring lesson preparation with educator review',['content'],['documents'],['automation','ai']),
('fitness','Fitness professional','fitness','Sessions and programmes arranged directly',['booking'],['whatsapp'],['booking','website']),
('invoice','Manual invoicing','cross-industry','Repeated invoice preparation and follow-up',['invoices'],['spreadsheets'],['automation','integration']),
('appointments','Appointment management','cross-industry','Repeated scheduling and reminder work',['booking'],['calendar'],['booking']),
('social','Social-only presence','cross-industry','Public identity depends on a social platform',['credibility'],['instagram'],['website','email']),
('modernize','Existing website modernization','cross-industry','A website no longer meets a confirmed goal',['outdated'],['website'],['modernization']),
('editorial','Recurring research and content','publishing','Research and drafts recur; publication requires approval',['content'],['documents'],['publishing','cms','ai'])]
for id,title,industry,situation,problems,tools,patterns in rows:
    record=dict(id=id,title=title,industry=industry,situation=situation,problems=problems,tools=tools,goals=problems,patterns=patterns,
      challenges=[f'Potential {p} friction; confirm with the current user' for p in problems],
      discoveryQuestions=['What actually happens today?','How often does it happen?','What outcome would justify a change?'],
      evidenceRequirements=['A user-confirmed problem','An example of the current workflow','Constraints and willingness to change'],
      assumptions=['Reference pattern only; industry does not establish a need'],
      complexityConsiderations=['Existing system access','Migration effort','Ongoing ownership'],
      relevantServices=patterns,unsuitableConditions=['No confirmed problem','Existing tools already meet the goal','Maintenance or subscription commitment is unacceptable'])
    (root/'data/scenarios'/f'{id}.json').write_text(json.dumps(record,indent=2)+'\n')
base=dict(stage='established',kind='business',presence=['instagram'],tools='WhatsApp',problems=['credibility'],goals='A credible place to show my work and receive enquiries',constraints='Limited technical knowledge',budget='Not established',timing='No fixed date')
personas=[
('nail-technician','Instagram-only nail technician',dict(base,industry='Independent nail technician; I work alone',goals='A credible gallery of treatments; keep WhatsApp enquiries'),['website','email'],['booking']),
('professional','Independent designer',dict(base,kind='professional',industry='Freelance graphic designer',portfolio='Selected existing projects and a clear enquiry route',goals='A professional portfolio for prospective clients'),['portfolio'],[]),
('invoice-business','Manual invoice business',dict(base,industry='Small maintenance business',presence=['website','email'],website='The website works well for enquiries',tools='Spreadsheets and accounting software',problems=['invoices'],invoiceDetails='I copy approved timesheet totals into invoices weekly; accounting records must stay intact',goals='Reduce duplicate entry while retaining invoice approval'),['automation'],['modernization','website']),
('teacher','Recurring lesson preparation',dict(base,kind='professional',industry='Teacher',portfolio='No public portfolio required',presence=['none'],tools='Documents and approved curriculum resources',problems=['content'],contentDetails='Weekly lesson research and draft plans with mandatory teacher review; no pupil data',goals='Spend less time on repeated preparation'),['publishing'],['website']),
('kai','kai editorial website proposal',dict(base,stage='specific',industry='kai, a proposed AI editorial website',request='A website with a future research, draft approval and publishing workflow',presence=['none'],tools='No current platform',problems=['content','custom'],contentDetails='Recurring research from cited sources; every draft needs approval before publishing',goals='A proposed publishing workflow with source checks and human approval',constraints='Do not implement recurring publishing in this iteration'),['publishing','webapp'],[])]
for id,name,answers,expected,excluded in personas:
    (root/'data/personas'/f'{id}.json').write_text(json.dumps(dict(id=id,name=name,synthetic=True,description='Hypothetical persona for internal evaluation; no commercial outcomes.',answers=answers,chat=['What would be a sensible first step?'],expectedServices=expected,excludedServices=excluded),indent=2)+'\n')
