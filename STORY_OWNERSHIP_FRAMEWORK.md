# Story Ownership Framework
## Community Storytellers Own Their Narratives

### The Problem We're Solving

**Traditional media model:**
- Journalist extracts story from community
- Publication owns copyright
- Community member gets: exposure (maybe), nothing (usually)
- Story used for grants, policy, books → community gets $0
- Community can't control how story is used or remove it

**This is extraction, not collaboration.**

---

## Our Model: Storyteller Ownership + Platform License

### Core Principle

**The storyteller owns the story. Period.**

JusticeHub gets a license to publish and use the story, but ownership stays with the community member who shared their knowledge.

### What This Means

**Storyteller Rights:**
- ✅ Own the copyright to their story
- ✅ Receive NFT proving ownership (optional but recommended)
- ✅ Can revoke platform license anytime
- ✅ Can request modifications anytime
- ✅ Receive revenue share when story generates value
- ✅ Control how story is used for advocacy

**Platform Rights:**
- ✅ Non-exclusive license to publish on JusticeHub
- ✅ Permission to use in grant applications (with revenue share)
- ✅ Permission to share on social media (crediting storyteller)
- ✅ Permission to include in advocacy materials (with consent)
- ❌ No right to sell or license without storyteller consent
- ❌ No right to modify without storyteller consent
- ❌ No right to use if storyteller revokes license

---

## Implementation: 3 Levels

### Level 1: Database Registry (Simplest)

**What:** Track ownership in your Supabase database
**Good for:** Starting out, 1-20 stories
**Cost:** Free
**Setup time:** 1 hour

**Database Schema:**

```sql
-- Create ownership registry table
CREATE TABLE story_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),
  storyteller_name TEXT NOT NULL,
  storyteller_contact TEXT, -- email or phone
  storyteller_wallet TEXT, -- for future payments

  -- Rights & licensing
  ownership_type TEXT DEFAULT 'full_ownership_with_platform_license',
  platform_license TEXT DEFAULT 'non_exclusive_revocable',
  can_modify BOOLEAN DEFAULT true,
  can_revoke BOOLEAN DEFAULT true,

  -- Revenue sharing
  revenue_share_percent INTEGER DEFAULT 10, -- 10% of grants citing story
  payment_method TEXT, -- 'bank_transfer', 'crypto', 'community_fund'
  payment_details JSONB, -- bank details or wallet address

  -- Consent & documentation
  consent_form_url TEXT, -- Link to signed consent
  consent_date TIMESTAMP,
  consent_expiry TIMESTAMP, -- NULL = no expiry

  -- Tracking
  total_revenue_generated DECIMAL DEFAULT 0,
  total_revenue_paid DECIMAL DEFAULT 0,
  last_payment_date TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create revenue tracking table
CREATE TABLE story_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),
  ownership_id UUID REFERENCES story_ownership(id),

  -- Event details
  event_type TEXT, -- 'grant_citation', 'media_license', 'book_deal', 'speaking'
  event_date DATE,
  event_description TEXT,

  -- Revenue
  total_amount DECIMAL,
  storyteller_share DECIMAL,
  platform_share DECIMAL,

  -- Payment
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'declined'
  payment_date TIMESTAMP,
  payment_reference TEXT,

  -- Source
  source_organization TEXT,
  source_contact TEXT,
  source_documentation_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE story_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),

  -- Usage details
  usage_type TEXT, -- 'grant_application', 'media_article', 'policy_document', 'presentation'
  used_by TEXT, -- Organization or person
  usage_date DATE,
  usage_url TEXT,

  -- Consent check
  consent_verified BOOLEAN DEFAULT false,
  consent_verified_by TEXT,
  consent_verified_date TIMESTAMP,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**How to Use:**

```sql
-- Register story ownership
INSERT INTO story_ownership (
  story_id,
  storyteller_name,
  storyteller_contact,
  consent_date,
  revenue_share_percent,
  payment_method
) VALUES (
  'aunty-corrine-mount-isa-unpaid-expertise',
  'Aunty Corrine',
  'via.justicehub@example.com',
  NOW(),
  10,
  'bank_transfer'
);

-- Track revenue event
INSERT INTO story_revenue_events (
  story_id,
  event_type,
  event_description,
  total_amount,
  storyteller_share,
  source_organization
) VALUES (
  'aunty-corrine-mount-isa-unpaid-expertise',
  'grant_citation',
  'NSW Community Safety Grant cited Aunty Corrine story as evidence',
  50000, -- Total grant amount
  5000,  -- 10% to storyteller
  'NSW Department of Communities and Justice'
);

-- Track usage
INSERT INTO story_usage_log (
  story_id,
  usage_type,
  used_by,
  usage_url
) VALUES (
  'aunty-corrine-mount-isa-unpaid-expertise',
  'policy_document',
  'Queensland Government Youth Justice Review',
  'https://qld.gov.au/justice-review-2025.pdf'
);
```

**Storyteller Dashboard Query:**

```sql
-- Show storyteller everything about their story
SELECT
  so.storyteller_name,
  so.story_id,
  a.title,
  a.is_published,
  so.total_revenue_generated,
  so.total_revenue_paid,
  (so.total_revenue_generated - so.total_revenue_paid) as amount_owed,
  COUNT(sre.id) as revenue_events,
  COUNT(sul.id) as times_used
FROM story_ownership so
JOIN articles a ON so.story_id = a.slug
LEFT JOIN story_revenue_events sre ON so.id = sre.ownership_id
LEFT JOIN story_usage_log sul ON so.story_id = sul.story_id
WHERE so.storyteller_contact = 'via.justicehub@example.com'
GROUP BY so.id, a.title, a.is_published;
```

---

### Level 2: NFT Ownership (Medium Complexity)

**What:** Mint NFT representing story ownership
**Good for:** 20+ stories, want provable on-chain ownership
**Cost:** ~$5-50 per NFT (gas fees)
**Setup time:** 1 day

**Why NFTs?**
- Provable ownership that storyteller controls
- Can't be revoked by platform
- Portable (storyteller owns it in their wallet)
- Enables automatic revenue sharing via smart contracts
- Storyteller can sell/transfer ownership if they want

**Smart Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CommunityStoryOwnership is ERC721, Ownable {
    struct StoryRights {
        string storyId;          // e.g. "aunty-corrine-mount-isa-unpaid-expertise"
        string storyTitle;
        string storytellerName;
        uint256 mintDate;
        uint8 revenueSharePercent; // e.g. 10 for 10%
        bool canRevoke;
        bool isRevoked;
    }

    mapping(uint256 => StoryRights) public stories;
    mapping(string => uint256) public storyIdToTokenId;
    uint256 private _tokenIdCounter;

    event StoryMinted(
        uint256 indexed tokenId,
        string storyId,
        address indexed storyteller,
        uint8 revenueSharePercent
    );

    event StoryRevoked(
        uint256 indexed tokenId,
        string storyId,
        address indexed storyteller
    );

    event RevenueDistributed(
        uint256 indexed tokenId,
        address indexed storyteller,
        uint256 amount,
        string source
    );

    constructor() ERC721("JusticeHub Community Story", "JHSTORY") {}

    /**
     * @dev Mint new story ownership NFT
     * @param storyteller Address of the community storyteller
     * @param storyId Unique story identifier
     * @param storyTitle Title of the story
     * @param storytellerName Name of storyteller
     * @param revenueSharePercent Percentage of revenue storyteller receives
     */
    function mintStory(
        address storyteller,
        string memory storyId,
        string memory storyTitle,
        string memory storytellerName,
        uint8 revenueSharePercent
    ) public onlyOwner returns (uint256) {
        require(storyteller != address(0), "Invalid storyteller address");
        require(bytes(storyId).length > 0, "Story ID required");
        require(storyIdToTokenId[storyId] == 0, "Story already exists");
        require(revenueSharePercent <= 100, "Invalid percentage");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(storyteller, tokenId);

        stories[tokenId] = StoryRights({
            storyId: storyId,
            storyTitle: storyTitle,
            storytellerName: storytellerName,
            mintDate: block.timestamp,
            revenueSharePercent: revenueSharePercent,
            canRevoke: true,
            isRevoked: false
        });

        storyIdToTokenId[storyId] = tokenId;

        emit StoryMinted(tokenId, storyId, storyteller, revenueSharePercent);

        return tokenId;
    }

    /**
     * @dev Storyteller can revoke platform license
     * @param tokenId ID of the story NFT
     */
    function revokeStory(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not story owner");
        require(stories[tokenId].canRevoke, "Cannot revoke");
        require(!stories[tokenId].isRevoked, "Already revoked");

        stories[tokenId].isRevoked = true;

        emit StoryRevoked(tokenId, stories[tokenId].storyId, msg.sender);
    }

    /**
     * @dev Platform distributes revenue to storyteller
     * @param tokenId ID of the story NFT
     * @param source Description of revenue source
     */
    function distributeRevenue(
        uint256 tokenId,
        string memory source
    ) public payable onlyOwner {
        require(!stories[tokenId].isRevoked, "Story revoked");

        address storyteller = ownerOf(tokenId);
        uint256 storytellerAmount = msg.value;

        (bool sent, ) = storyteller.call{value: storytellerAmount}("");
        require(sent, "Failed to send revenue");

        emit RevenueDistributed(tokenId, storyteller, storytellerAmount, source);
    }

    /**
     * @dev Get story details
     */
    function getStory(uint256 tokenId) public view returns (StoryRights memory) {
        require(_exists(tokenId), "Story does not exist");
        return stories[tokenId];
    }

    /**
     * @dev Check if story is still licensed to platform
     */
    function isLicensed(string memory storyId) public view returns (bool) {
        uint256 tokenId = storyIdToTokenId[storyId];
        if (tokenId == 0) return false;
        return !stories[tokenId].isRevoked;
    }
}
```

**How to Use:**

```javascript
// Mint story ownership NFT when publishing
const tx = await storyOwnershipContract.mintStory(
  "0xStorytellerWallet", // Storyteller's Ethereum/Polygon address
  "aunty-corrine-mount-isa-unpaid-expertise",
  "I Need Voices Behind Me: Aunty Corrine's 20 Years",
  "Aunty Corrine",
  10 // 10% revenue share
);

// Wait for confirmation
await tx.wait();

// Storyteller now owns NFT proving ownership
// They can see it in their wallet (MetaMask, etc.)

// When grant uses story, send revenue automatically
const revenueAmount = ethers.utils.parseEther("0.5"); // 0.5 ETH
await storyOwnershipContract.distributeRevenue(
  tokenId,
  "NSW Community Safety Grant citation",
  { value: revenueAmount }
);

// Revenue automatically sent to storyteller's wallet
```

---

### Level 3: Full Web3 Platform (Advanced)

**What:** Storyteller portal + DAO governance + auto revenue distribution
**Good for:** 100+ stories, community-governed platform
**Cost:** Development time (2-3 months) + ongoing gas fees
**Setup time:** 2-3 months

**Features:**

**Storyteller Self-Service Portal:**
- Login with wallet (no passwords)
- See all your stories
- View revenue generated and paid
- Request modifications
- Revoke stories
- Set revenue preferences (direct payment vs. community fund)

**Community Governance (DAO):**
- Community votes on which stories to publish
- Community reviews for ethical standards
- Revenue distribution policies set by community
- Platform changes require community approval

**Automated Revenue Distribution:**
- Smart contract monitors grants, policy docs, media licenses
- Automatically calculates storyteller share
- Distributes payments monthly without manual intervention
- Transparent ledger of all value flows

**Example Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│         Storyteller Web3 Wallet (MetaMask)              │
│                                                         │
│  - Owns story NFTs                                      │
│  - Receives revenue automatically                       │
│  - Can revoke stories                                   │
│  - Participates in governance                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│         JusticeHub Smart Contracts (Polygon)            │
│                                                         │
│  StoryOwnership.sol - NFT ownership registry            │
│  RevenueDistribution.sol - Auto revenue sharing         │
│  GovernanceDAO.sol - Community decision-making          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│         Traditional Platform (Supabase + Next.js)       │
│                                                         │
│  - Story content (still in database)                    │
│  - Website UI                                           │
│  - Checks blockchain for ownership/license              │
│  - Displays only licensed (non-revoked) stories         │
└─────────────────────────────────────────────────────────┘
```

---

## Revenue Sharing Models

### Model 1: Fixed Percentage

**How it works:** Storyteller gets X% of any revenue generated by their story

**Example:**
- Grant application cites story: 10% of grant to storyteller
- Media outlet licenses story: 50% to storyteller
- Book deal includes story: 50% to storyteller
- Policy consultation using story: Storyteller decides fee

**Best for:** Simple, transparent, easy to explain

### Model 2: Tiered Value

**How it works:** Different types of usage have different values

**Example:**
```javascript
const revenueShare = {
  grant_citation: {
    amount: grantAmount * 0.10,  // 10% of grant
    description: "Story cited as evidence in successful grant"
  },
  media_license: {
    amount: 500,  // Flat fee
    description: "News outlet republished story"
  },
  policy_reference: {
    amount: 2000,  // Flat fee
    description: "Government policy document cited story"
  },
  book_inclusion: {
    amount: bookRevenue * 0.50,  // 50% of book revenue
    description: "Story included in published book"
  },
  speaking_opportunity: {
    amount: "storyteller_sets",  // Storyteller negotiates directly
    description: "Invited to speak based on story"
  }
};
```

**Best for:** Recognizing different types of value

### Model 3: Community Fund Option

**How it works:** Storyteller can direct revenue to community infrastructure

**Example:**
```javascript
const revenuDistribution = {
  storyteller: "Aunty Corrine",
  revenue_generated: 10000,
  distribution_preference: "community_fund",
  split: {
    to_storyteller: 3000,         // 30% direct
    to_mount_isa_fund: 7000       // 70% to community infrastructure
  },
  storyteller_note: "Use this for the Aunties building fund"
};
```

**Best for:** Storytellers who want to support community infrastructure

### Model 4: Credit System

**How it works:** Track "value credits" even when cash doesn't flow

**Example:**
```javascript
const valueCredits = {
  storyteller: "Aunty Corrine",
  credits_earned: [
    {
      type: "influence_credit",
      description: "Story cited in QLD Youth Justice Review",
      value: "High - influenced policy",
      redeemable: "Speaking opportunity, consultation fee"
    },
    {
      type: "advocacy_credit",
      description: "Story shared by Change the Record",
      value: "Medium - amplified reach",
      redeemable: "Platform for future stories"
    },
    {
      type: "evidence_credit",
      description: "Academics citing story in 3 papers",
      value: "Medium - academic validation",
      redeemable: "Co-authorship opportunities"
    }
  ],
  total_influence: "Very High",
  redeemable_opportunities: [
    "Keynote speaking ($5,000)",
    "Policy consultation ($10,000)",
    "Co-author academic paper",
    "Featured in documentary"
  ]
};
```

**Best for:** Recognizing non-monetary value and opening opportunities

---

## Implementation Roadmap

### Phase 1: Database Registry (Week 1)
```sql
-- Run SQL to create tables
-- Add ownership records for existing stories
-- Set up basic revenue tracking
```

**Output:** Can track ownership and revenue in database

### Phase 2: Storyteller Dashboard (Week 2-3)
```javascript
// Build simple Next.js page
// Show storyteller their stories, revenue, usage
// Allow requesting modifications
```

**Output:** Storytellers can see their data

### Phase 3: Payment Automation (Week 4)
```javascript
// Set up Stripe Connect or crypto wallets
// Automate monthly payment runs
// Send payment notifications
```

**Output:** Payments happen automatically

### Phase 4: NFT Minting (Month 2)
```solidity
// Deploy smart contract to Polygon
// Mint NFTs for existing stories
// Send to storytellers' wallets
```

**Output:** Provable on-chain ownership

### Phase 5: Self-Service Portal (Month 3)
```javascript
// Web3 wallet login
// Storyteller can modify/revoke
// Community can review
```

**Output:** Full storyteller control

---

## Legal Framework

### Ownership Agreement Template

```markdown
# Story Ownership Agreement

Between:
- **Storyteller:** [Name]
- **Platform:** JusticeHub

## 1. Ownership

The Storyteller retains full copyright ownership of the story titled:
"[Story Title]"

Published at: justicehub.au/stories/[slug]

## 2. Platform License

The Storyteller grants JusticeHub a **non-exclusive, revocable license** to:
- Publish the story on justicehub.au
- Share on social media (crediting Storyteller)
- Include in grant applications (with revenue share)
- Use for advocacy purposes (with consent for specific uses)

## 3. Storyteller Rights

The Storyteller may:
- Request modifications at any time
- Revoke this license at any time
- Receive [X]% of revenue when story generates value
- Transfer ownership to another person/organization
- License story to other platforms/media

## 4. Revenue Sharing

When the story generates revenue through:
- Grant applications citing story: [X]% to Storyteller
- Media licensing: [X]% to Storyteller
- Book deals: [X]% to Storyteller
- Other uses: As negotiated

Revenue paid within 30 days of receipt.

## 5. Attribution

The story will always be attributed to:
[Storyteller Name]

With byline:
[Preferred description, e.g., "Community Elder, Mount Isa"]

## 6. Revocation

If Storyteller revokes license:
- Story removed from website within 7 days
- Social media posts archived (historical record)
- Future grant applications will not cite story
- Existing citations remain (can't unpublish others' work)

## 7. Modifications

Storyteller can request modifications by:
- Email: stories@justicehub.au
- Phone: [number]
- Changes implemented within 7 days

## 8. Data & Privacy

- Interview recordings stored securely
- Only accessible to authorized platform staff
- Can be deleted upon request
- Never shared without permission

---

Signed:

**Storyteller:**
Name: ___________________
Date: ___________________
Signature: ___________________

**Platform:**
Name: ___________________
Organization: JusticeHub
Date: ___________________
Signature: ___________________
```

---

## Success Metrics

Track these to measure if ownership model is working:

### Storyteller Satisfaction
- [ ] 90%+ of storytellers feel they own their story
- [ ] 100% know how to request changes or revoke
- [ ] 80%+ have received payment or credits
- [ ] 0 complaints about unauthorized use

### Value Flow
- [ ] Average revenue per story: $____ /year
- [ ] Total paid to storytellers: $____
- [ ] Payment latency: < 30 days
- [ ] Stories generating value: ___%

### Platform Health
- [ ] Stories revoked: __% (low is good)
- [ ] Modifications requested: __% (some is healthy)
- [ ] New storytellers referred by existing: __% (trust indicator)
- [ ] Community governance participation: ___%

---

## Common Questions

**Q: What if storyteller doesn't have a crypto wallet?**
A: Level 1 (database) works fine. Pay via bank transfer. Offer to help set up wallet if they want.

**Q: What if storyteller dies or can't be reached?**
A: Estate/family inherits ownership. Document next-of-kin in agreement.

**Q: What if platform shuts down?**
A: NFT ownership persists. Storyteller still owns story and can republish elsewhere.

**Q: Can storyteller sell their story?**
A: Yes! They own it. NFT makes this easy - they transfer to buyer.

**Q: What stops platform from ignoring this?**
A: Smart contract enforces it automatically. If platform revokes enforcement, community forks platform.

---

**This is how we flip extraction into collaboration.**

Storytellers own their knowledge. Platform gets license. Value flows back to community. Simple.
