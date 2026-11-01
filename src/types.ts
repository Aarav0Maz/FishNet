export interface Persona { template: string; name: string; title: string; company: string; bio: string; valuation: string; hue: number }
export interface Tags { skills: string[]; interests: string[]; goals: string[] }
export interface RealIdentity { name: string; role: string; bio: string; linkedin: string }
export interface Settings { discoverable: boolean; showInGraph: boolean }
export interface MyProfile { id: string; real: RealIdentity; tags: Tags; settings: Settings; persona: Persona }
export type MyProfileInput = Omit<MyProfile, 'id'>
export interface Candidate { id: string; persona: Persona; tags: Tags; score: number }
export type RevealState = 'none' | 'requested_by_me' | 'requested_of_me' | 'revealed'
export interface Connection { id: string; otherId: string; persona: Persona; tags: Tags; since: string; reveal: RevealState; identity?: RealIdentity }
export interface GraphNode { id: string; persona: Persona; degree: number; revealedName?: string }
export interface GraphData { nodes: GraphNode[]; edges: [string, string][] }
export type IntroStatus = 'pending_via' | 'pending_target' | 'completed' | 'declined'
export interface IntroRequest {
  id: string; requesterId: string; viaId: string; targetId: string; note: string; status: IntroStatus; createdAt: string
  names: { requester: string; via: string; target: string }
  myRole: 'requester' | 'via' | 'target'
}
export type NoticeKind = 'match' | 'intro_request' | 'intro_accepted' | 'intro_declined' | 'intro_forwarded' | 'reveal_request' | 'reveal_approved'
export interface Notice { id: string; kind: NoticeKind; name: string; read: boolean; createdAt: string; simulated?: boolean }

export interface DataSource {
  kind: 'demo' | 'live'
  getMe(): Promise<MyProfile | null>
  saveMe(p: MyProfileInput): Promise<MyProfile>
  discover(offset: number, limit: number): Promise<Candidate[]>
  swipe(id: string, dir: 'like' | 'pass'): Promise<{ matched: boolean }>
  connections(): Promise<Connection[]>
  graph(): Promise<GraphData>
  recommendations(): Promise<Candidate[]>
  intros(): Promise<IntroRequest[]>
  requestIntro(viaId: string, targetId: string, note: string): Promise<void>
  respondIntro(id: string, accept: boolean): Promise<void>
  setReveal(otherId: string, consent: boolean): Promise<void>
  notices(): Promise<Notice[]>
  markNoticesRead(): Promise<void>
  subscribe?(cb: () => void): () => void
}

export const TEMPLATES: Record<string, Omit<Persona, 'template' | 'hue'> & { label: string }> = {
  billionaire: { label: 'Billionaire Founder', name: 'Maxwell Vantage', title: 'Founder & Chairman', company: 'Vantage Holdings', bio: 'Built an empire out of pure confidence and one very good slide deck.', valuation: '$4.2B' },
  vc: { label: 'Venture Capitalist', name: 'Sloane Ashcroft', title: 'Managing Partner', company: 'Ashcroft Ventures', bio: 'Writes small cheques and big opinions. Has "conviction" about everything.', valuation: '$900M AUM' },
  exec: { label: 'Tech Executive', name: 'Jordan Pike', title: 'Chief Synergy Officer', company: 'Hyperscale Dynamics', bio: 'Leads cross-functional alignment across seventeen time zones, mostly on mute.', valuation: '$12B' },
  visionary: { label: 'Startup Visionary', name: 'Nova Lindqvist', title: 'CEO & Co-founder', company: 'Lumina Labs', bio: 'Pre-revenue, post-hype. Disrupting disruption itself.', valuation: '$300M' },
  ai: { label: 'AI Research Leader', name: 'Dr. Ilya Brightwater', title: 'Head of Frontier Research', company: 'Aperture Minds', bio: 'Trains very large models on very small amounts of sleep.', valuation: '$2.8B' },
  investor: { label: 'Influential Investor', name: 'Beatrix Holloway', title: 'Principal, Family Office', company: 'Holloway Capital', bio: 'Known for backing winners one week after everyone else.', valuation: '$1.5B AUM' },
}
export const TEMPLATE_KEYS = Object.keys(TEMPLATES)
