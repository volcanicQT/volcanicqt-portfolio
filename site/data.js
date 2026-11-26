// ─────────────────────────────────────────────────────────────
//  EDIT ME — every word on the site comes from this file.
//  Sources: Santanu_Saha_Portfolio_Updated.pdf, Canva deck, x.com/VolcanicQT
// ─────────────────────────────────────────────────────────────
export const DATA = {
  firstName: 'Santanu',
  lastName: 'Saha',
  brand: 'VolcanicQT',
  initials: 'VQ',
  handle: '@VolcanicQT',
  avatar: 'assets/avatar.jpg',
  photo: 'assets/me.png',
  status: 'Open for creator collabs',
  roles: ['Content Creator', 'Lead Game Tester', 'Social Media Manager', 'Growth Strategist', 'Campaign Content Reviewer'],
  intro:
    'Gamer, streamer and creator on X. I make gaming and Web3 content that drives engagement and builds communities, as a content creator for Immutable and Binance and an ambassador for Loadout.',

  about: {
    title: 'Content people <span class="hl">actually stop</span> scrolling for.',
    body:
      'Gamer, streamer and creator from Kolkata, India. I started in game testing, moved up to senior QA, then into community moderation and content production. That mix means I know the gameplay, the players, and the people building the game, and I turn product updates into content players actually watch.',
  },

  stats: [
    { value: 28000, suffix: '+', label: 'Posts on X' },
    { value: 7000, suffix: '+', label: 'Followers grown from 0' },
    { value: 500, suffix: '+', label: 'Community members' },
  ],

  featured: {
    kicker: 'Game jam winner · Aug 2026',
    title: 'Pixel Abyss',
    body: '5th place at VibeBlitz, a global virtual game jam by Vibecode.game with YGG and Minds by Animoca Brands. $5,000 total prize pool.',
    prize: '$400',
    image: 'assets/jam/pixel-abyss.jpg',
    url: 'https://x.com/Vibecode_game/status/2087072183621489121',
  },

  // big = the highlight number shown on the left of each row
  achievements: [
    { big: '#5', title: 'VibeBlitz game jam: Pixel Abyss', org: 'Vibecode.game × YGG × Minds, Aug 2026', tag: 'Winner' },
    { big: 'IMX', title: 'Selected as an Immutable Starter Creator', org: 'Content for the Web3 gaming ecosystem', tag: 'Selected' },
    { big: '✓', title: 'Verified creator on X: @VolcanicQT', org: 'Content creator for Immutable & Binance · Loadout ambassador', tag: 'Verified' },
    { big: '7K+', title: 'Grew an audience from 0 to 7,000+ followers', org: 'Gaming short-form content', tag: 'Growth' },
    { big: '500+', title: 'Founded BlackVeil Society', org: 'Web3 gaming community, 500+ members', tag: 'Founder' },
    { big: '131K', title: 'Built the AimLock X profile', org: '@aimlockgame, 131.5K followers shown', tag: 'Case study' },
  ],

  programs: [
    { name: 'Immutable', role: 'Creator Program', logo: 'assets/logos/immutable.png', url: 'https://x.com/Immutable' },
    { name: 'YGG Play', role: 'Content Creator', logo: 'assets/logos/ygg.png', url: 'https://x.com/YGG_Play' },
    { name: 'Loadout', role: 'Ambassador', logo: 'assets/logos/loadout.png', url: 'https://x.com/loadoutprotocol' },
    { name: 'Glip', role: 'Social Media Manager', logo: 'assets/logos/glip.png', url: 'https://glip.gg' },
    { name: 'Binance', role: 'Content Creator', logo: 'assets/logos/binance.jpg', url: 'https://x.com/binance' },
    { name: 'BlackVeil Society', role: 'Founder', logo: 'assets/logos/blackveil.jpg', url: 'https://x.com/BlackVeil_ST' },
  ],

  experience: [
    { co: 'GLIP.GG', role: 'Social Media Content Creator', when: 'Mar 2025 – now' },
    { co: 'GLIP.GG', role: 'Moderator', when: 'Aug 2024 – now' },
    { co: 'GLIP.GG', role: 'Game Tester', when: 'Feb 2022 – now' },
    { co: 'Heyo Entertainment', role: 'Content Producer', when: 'Mar – Jul 2025' },
    { co: 'Heyo Entertainment', role: 'Moderator', when: 'Aug 2024 – Mar 2025' },
    { co: 'Heyo Entertainment', role: 'Senior Game Tester', when: 'Oct 2023 – Aug 2024' },
    { co: 'Heyo Entertainment', role: 'Game Tester', when: 'Jun – Oct 2023' },
  ],
  skills: ['Game QA', 'Bug tracking', 'JIRA / Trello', 'Unity', 'Short-form video', 'Content calendars', 'Community growth', 'Premiere Pro', 'Photoshop', 'CapCut', 'Blender', 'Canva'],

  // Showcase videos (autoplay muted while on screen; tap the speaker to hear at low volume)
  videos: [
    { src: 'assets/videos/thrones.mp4', poster: 'assets/videos/thrones.jpg', ratio: 'v', title: 'Crypto of Thrones: the game that handed me the receipts', tag: 'Game review', url: 'https://x.com/VolcanicQT/status/2125891978177171871' },
    { src: 'assets/videos/canborsa.mp4', poster: 'assets/videos/canborsa.jpg', ratio: 'h', title: 'Canborsa Road to One Million: the $10K breakdown', tag: 'Campaign', url: 'https://x.com/VolcanicQT/status/2123021745234059291' },
    { src: 'assets/videos/ecosystem.mp4', poster: 'assets/videos/ecosystem.jpg', ratio: 'h', title: 'I found out from a reply on my own post', tag: 'Story', url: 'https://x.com/VolcanicQT/status/2122263775529324598' },
    { src: 'assets/videos/gamenight.mp4', poster: 'assets/videos/gamenight.jpg', ratio: 'v', title: 'Every real opportunity traces back to a game night', tag: 'Community', url: 'https://x.com/VolcanicQT/status/2125529812454522988' },
  ],
  thumbs: [
    { src: 'assets/work/ragnarok.jpg', label: 'YGG Play · Ragnarok Breaker' },
    { src: 'assets/work/levelup.jpg', label: 'Immutable · Level Up' },
    { src: 'assets/work/stream.jpg', label: 'Live stream overlay' },
    { src: 'assets/work/whatif.jpg', label: 'YouTube talking head' },
  ],

  // Contact / call to action
  cta: {
    kicker: 'Full-time UGC creator · Available for campaigns',
    title: "Got a launch? I'll make everyone <span class=\"hl\">care.</span>",
    body: 'I help games and brands turn attention into community, growth and revenue through content. Reviews, launch videos, X threads, streams and campaign UGC: scripted, shot, edited and posted by someone who actually plays.',
    audiences: ['Game studios', 'Web3 & on-chain games', 'Exchanges & trading apps', 'Fintech & finance brands', 'Creator campaigns'],
  },
  process: [
    { n: '01', title: 'Brief & play', body: 'I play the game or test the product and learn who it is for, so the content sounds like a player, not an ad.' },
    { n: '02', title: 'Script & shoot', body: 'Hooks, scripts and edits made for each platform: X threads, short-form video, streams and YouTube.' },
    { n: '03', title: 'Post & report', body: 'Published on schedule, then a recap of reach, engagement and what to do next.' },
  ],
  // Logo strip under the hero (all clickable)
  trusted: [
    { name: 'Immutable', logo: 'assets/logos/immutable.png', url: 'https://x.com/Immutable' },
    { name: 'YGG Play', logo: 'assets/logos/ygg.png', url: 'https://x.com/YGG_Play' },
    { name: 'Binance', logo: 'assets/logos/binance.jpg', url: 'https://x.com/binance' },
    { name: 'Loadout', logo: 'assets/logos/loadout.png', url: 'https://x.com/loadoutprotocol' },
    { name: 'Glip', logo: 'assets/logos/glip.png', url: 'https://glip.gg' },
    { name: 'Vibecode.game', logo: 'assets/logos/vibecode.jpg', url: 'https://x.com/Vibecode_game' },
    { name: 'BlackVeil Society', logo: 'assets/logos/blackveil.jpg', url: 'https://x.com/BlackVeil_ST' },
  ],
  // Fuzzy 3D blobs in the background that open a link when clicked
  telegram: 'https://t.me/volcanicqt',
  blobLinks: [
    { label: 'Telegram', url: 'https://t.me/volcanicqt' },
    { label: 'X', url: 'https://x.com/VolcanicQT' },
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCav30PxrQkOgOk4XGjptmLw' },
    { label: 'Book a call', url: 'https://calendly.com/volcanicglip-gg/30min' },
    { label: 'Kick', url: 'https://kick.com/volcanicqt' },
  ],

  music: { ogg: 'assets/audio/chill.ogg', m4a: 'assets/audio/chill.m4a' },
  email: 'volcanicglip.gg@gmail.com',
  calendly: 'https://calendly.com/volcanicglip-gg/30min',
  socials: [
    { label: 'X', url: 'https://x.com/VolcanicQT' },
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCav30PxrQkOgOk4XGjptmLw' },
    { label: 'Kick', url: 'https://kick.com/volcanicqt' },
    { label: 'Telegram', url: 'https://t.me/volcanicqt' },
    { label: 'Linktree', url: 'https://linktr.ee/VolcanicCC' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/santanusaha9999' },
  ],

  // Short text on the 3D cube tiles (≤ 4 characters each)
  cubeLabels: ['IMX', '#5', 'YGG', '28K', '▶', 'GG', 'QA', '7K', 'UGC', '★', '500', 'XP', 'BNB', 'LVL'],
  floatBadge: '#5',
  floatLabel: 'GG',

  tips: {
    device: 'Live stats · click to spin',
    float: 'VibeBlitz winner',
    smiley: 'BlackVeil Society',
    cursor: 'Click anything 3D',
    coinA: 'Creator programs',
    coinB: 'Watch the content',
    me: 'My streaming setup 🎮',
  },
};
