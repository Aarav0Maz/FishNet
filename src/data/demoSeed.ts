import type { Persona, RealIdentity, Tags } from '../types'

export interface SeedUser { id: string; persona: Persona; tags: Tags; real: RealIdentity }

const T = (skills: string, interests: string, goals: string): Tags => ({
  skills: skills.split('|'), interests: interests.split('|'), goals: goals.split('|'),
})

// name | title | company | valuation | template | skills | interests | goals | real name | real role
const rows: [string, string, string, string, string, string, string, string, string, string][] = [
  ['Aurelia Strand', 'Chairwoman', 'Strand Dynamics', '$6.1B', 'billionaire', 'Strategy|Finance', 'Climate|Fintech', 'Find investors|Mentorship', 'Priya Nair', 'Finance student, UofT'],
  ['Cassius Ironwood', 'Managing Partner', 'Ironwood Capital', '$2.2B AUM', 'vc', 'Finance|Deal sourcing', 'AI|Fintech', 'Find founders|Mentorship', 'Daniel Okafor', 'Analyst intern'],
  ['Zephyr Quill', 'Chief Visionary', 'Quillverse', '$800M', 'visionary', 'Design|Product', 'AI|Design', 'Find cofounder|Find investors', 'Mia Tanaka', 'Product design student'],
  ['Hollis Marchetti', 'CTO', 'Marchetti Systems', '$9B', 'exec', 'Backend|Infrastructure', 'Open source|AI', 'Hire engineers|Mentorship', 'Sam Okonkwo', 'Backend developer'],
  ['Dr. Odalys Frost', 'Chief Scientist', 'Frostbyte AI', '$3.4B', 'ai', 'Machine learning|Research', 'AI|Healthcare', 'Find cofounder|Research collaborators', 'Elena Rossi', 'ML research assistant'],
  ['Thaddeus Penn', 'Founder', 'Penn & Sons Ventures', '$5B', 'billionaire', 'Sales|Strategy', 'Real estate|Fintech', 'Find investors|Find customers', 'Marcus Lee', 'Sales associate'],
  ['Marguerite Vale', 'Principal', 'Vale Family Office', '$1.1B AUM', 'investor', 'Finance|Operations', 'Climate|Healthcare', 'Find founders|Mentorship', 'Chloe Martin', 'Business undergrad'],
  ['Rocco Sterling', 'Chief Disruption Officer', 'Sterling Hyperlab', '$14B', 'exec', 'Marketing|Growth', 'Consumer|Gaming', 'Find customers|Hire engineers', 'Ben Hughes', 'Marketing coordinator'],
  ['Seraphina Lux', 'CEO', 'Luxora', '$450M', 'visionary', 'Design|Branding', 'Consumer|Design', 'Find cofounder|Mentorship', 'Aisha Rahman', 'Brand design student'],
  ['Dr. Bram Whitlock', 'VP of Frontier Models', 'Whitlock Neural', '$2.1B', 'ai', 'Machine learning|Data', 'AI|Robotics', 'Research collaborators|Hire engineers', 'Noah Park', 'Data science grad'],
  ['Ignatius Crane', 'Partner', 'Crane Peak Ventures', '$700M AUM', 'vc', 'Deal sourcing|Strategy', 'Gaming|AI', 'Find founders', 'Leo Dubois', 'VC associate'],
  ['Vivienne Ashby', 'Founder', 'Ashby Industries', '$3.9B', 'billionaire', 'Operations|Strategy', 'Climate|Manufacturing', 'Find investors|Hire engineers', 'Grace Kim', 'Operations analyst'],
  ['Kai Osterhaus', 'Head of Everything', 'Osterhaus Labs', '$120M', 'visionary', 'Frontend|Product', 'Design|Open source', 'Find cofounder', 'Tyler Brooks', 'Frontend developer'],
  ['Lucinda Graves', 'Chief Alignment Officer', 'Graves Global', '$20B', 'exec', 'Operations|Leadership', 'Healthcare|Consumer', 'Mentorship|Hire engineers', 'Hannah Wolfe', 'Project manager'],
  ['Dr. Felix Nakamura', 'Director of Cognition', 'Nakamura Minds', '$1.7B', 'ai', 'Research|Robotics', 'Robotics|AI', 'Research collaborators|Find cofounder', 'Yuki Sato', 'Robotics PhD student'],
  ['Octavia Reyes', 'General Partner', 'Reyes Ventures', '$1.3B AUM', 'vc', 'Finance|Deal sourcing', 'Healthcare|Climate', 'Find founders|Mentorship', 'Camila Reyes', 'Biotech analyst'],
  ['Barnaby Holt', 'Angel Investor', 'Holt Holdings', '$600M AUM', 'investor', 'Strategy|Sales', 'Gaming|Consumer', 'Find founders|Find customers', 'Oliver Grant', 'Startup intern'],
  ['Persephone Kane', 'Founder & CEO', 'Kane Quantum', '$1.9B', 'billionaire', 'Physics|Strategy', 'Quantum|AI', 'Find investors|Research collaborators', 'Zoe Alvarez', 'Physics undergrad'],
  ['Evander Moss', 'Chief Hype Officer', 'MossMedia', '$75M', 'visionary', 'Marketing|Content', 'Consumer|Gaming', 'Find customers|Find cofounder', 'Jake Turner', 'Content creator'],
  ['Dr. Isolde Marchand', 'Chief AI Officer', 'Marchand Cognition', '$2.6B', 'ai', 'Machine learning|Ethics', 'AI|Healthcare', 'Mentorship|Research collaborators', 'Amara Diallo', 'AI policy researcher'],
  ['Leopold Archer', 'Chairman', 'Archer Logistics', '$7.3B', 'billionaire', 'Operations|Logistics', 'Manufacturing|Climate', 'Hire engineers|Find investors', 'Ryan Cooper', 'Supply chain analyst'],
  ['Genevieve Locke', 'Principal', 'Locke Capital', '$950M AUM', 'investor', 'Finance|Strategy', 'Fintech|Real estate', 'Find founders', 'Nina Petrova', 'Finance associate'],
  ['Tobias Wren', 'CEO', 'Wren Robotics', '$380M', 'visionary', 'Robotics|Hardware', 'Robotics|Manufacturing', 'Find cofounder|Hire engineers', 'Eli Cohen', 'Mechatronics student'],
  ['Calliope Dunn', 'SVP Synergy', 'Dunn Cloudworks', '$11B', 'exec', 'Infrastructure|Leadership', 'Open source|Fintech', 'Hire engineers|Mentorship', 'Sofia Mendes', 'Cloud engineer'],
]

const hue = (i: number) => 255 + ((i * 37) % 90)
export const DEMO_USERS: SeedUser[] = rows.map((r, i) => ({
  id: `demo-${i + 1}`,
  persona: { template: r[4], name: r[0], title: r[1], company: r[2], bio: `Fictional demo persona. ${r[1]} of ${r[2]}.`, valuation: r[3], hue: hue(i) },
  tags: T(r[5], r[6], r[7]),
  real: { name: r[8], role: r[9], bio: 'Fictional demo identity, not a real person.', linkedin: '' },
}))

/** Existing demo-world relationships (indices into DEMO_USERS). */
export const DEMO_EDGES: [number, number][] = [
  [0, 1], [0, 6], [1, 10], [1, 15], [2, 8], [2, 12], [3, 13], [3, 23], [4, 9], [4, 14], [4, 19], [5, 16], [5, 7], [6, 15],
  [7, 18], [8, 12], [9, 14], [10, 16], [11, 20], [11, 21], [13, 20], [15, 19], [17, 4], [17, 21], [18, 16], [20, 22], [22, 14], [23, 12], [21, 6], [11, 0],
]
/** Demo users already connected to the visitor at the start so the graph is explorable. */
export const DEMO_START_CONNECTIONS = [0, 3]
