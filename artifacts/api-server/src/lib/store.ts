import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  role: 'buyer' | 'artist' | 'admin' | 'unset';
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfileRecord {
  id: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  phone?: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProfileRecord {
  id: number;
  userId: string;
  displayName: string;
  slug: string;
  location: string;
  biography: string;
  imageUrl?: string;
  website?: string | null;
  rating: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtworkRecord {
  id: number;
  artistId: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  medium: string;
  dimensions: string;
  yearCreated: number;
  status: 'draft' | 'pending_review' | 'published' | 'sold' | 'archived';
  imageUrls: string[];
  artworkType: 'original' | 'print' | 'digital' | 'sculpture';
  featured: boolean;
  quantity: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemRecord {
  id: number;
  userId: string;
  artworkId: number;
  quantity: number;
  createdAt: string;
}

export interface WishlistRecord {
  id: number;
  userId: string;
  artworkId: number;
  createdAt: string;
}

export interface FollowRecord {
  id: number;
  userId: string;
  artistId: number;
  createdAt: string;
}

export interface OrderItemRecord {
  id: number;
  orderId: number;
  artworkId: number;
  artistId: number;
  title: string;
  quantity: number;
  unitPrice: number;
  commissionRate: number; // e.g. 10.0 (%)
  commissionAmount: number;
  artistAmount: number;
}

export interface OrderRecord {
  id: number;
  userId: string;
  stripeSessionId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  fullName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemRecord[];
}

export interface PaymentRecord {
  id: number;
  orderId: number;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentMethod: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface PayoutRecord {
  id: number;
  artistId: number;
  orderId?: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  payoutDate?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsRecord {
  commissionRate: number; // Default 10%
  currency: string;
  autoApproveArtworks: boolean;
  minPayoutAmount: number;
  updatedAt: string;
}

export interface ReviewRecord {
  id: number;
  artworkId?: number;
  artistId: number;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ConversationRecord {
  id: number;
  buyerId: string;
  artistId: number;
  artworkId?: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface MessageRecord {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface DatabaseState {
  users: UserRecord[];
  buyerProfiles: BuyerProfileRecord[];
  artistProfiles: ArtistProfileRecord[];
  categories: CategoryRecord[];
  artworks: ArtworkRecord[];
  cartItems: CartItemRecord[];
  wishlist: WishlistRecord[];
  follows: FollowRecord[];
  orders: OrderRecord[];
  orderItems: OrderItemRecord[];
  payments: PaymentRecord[];
  payouts: PayoutRecord[];
  settings: SettingsRecord;
  reviews: ReviewRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  notifications: NotificationRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'marketplace-store.json');

function getInitialState(): DatabaseState {
  const seedArtists: ArtistProfileRecord[] = [
    {
      id: 1,
      userId: 'usr_mira_sen',
      displayName: 'Mira Sen',
      slug: 'mira-sen',
      location: 'Jaipur, India',
      biography: "Mira's paintings find quiet movement in the colors and textures of everyday life. Her studio practice moves between memory, landscape, and the changing light of home.",
      imageUrl: '/artwork/after-the-rain.jpg',
      website: 'https://mirasenstudio.com',
      rating: 4.9,
      views: 1250,
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
    },
    {
      id: 2,
      userId: 'seed_artist_eli',
      displayName: 'Eli Navarro',
      slug: 'eli-navarro',
      location: 'Lisbon, Portugal',
      biography: 'Working across painting and mixed media, Eli builds layered compositions from walks, found color, and the imperfect geometry of the city.',
      imageUrl: '/artwork/blue-hour.jpg',
      website: 'https://elinavarro.art',
      rating: 4.8,
      views: 940,
      createdAt: '2025-01-12T10:00:00Z',
      updatedAt: '2025-01-12T10:00:00Z',
    },
    {
      id: 3,
      userId: 'seed_artist_aya',
      displayName: 'Aya Mori',
      slug: 'aya-mori',
      location: 'Kyoto, Japan',
      biography: 'Aya makes tactile forms shaped by patient observation. Her work draws on botanical silhouettes and the spaces between objects.',
      imageUrl: '/artwork/citrus-study.jpg',
      website: 'https://ayamori-ceramics.jp',
      rating: 5.0,
      views: 1820,
      createdAt: '2025-01-14T10:00:00Z',
      updatedAt: '2025-01-14T10:00:00Z',
    },
    {
      id: 4,
      userId: 'seed_artist_noah',
      displayName: 'Noah Bell',
      slug: 'noah-bell',
      location: 'Brooklyn, United States',
      biography: "Noah's photographs and paper works pay attention to small, overlooked moments: a window left open, a garden after rain, a room at rest.",
      imageUrl: '/artwork/quiet-room.jpg',
      website: 'https://noahbellphoto.com',
      rating: 4.7,
      views: 890,
      createdAt: '2025-01-16T10:00:00Z',
      updatedAt: '2025-01-16T10:00:00Z',
    },
  ];

  const seedCategories: CategoryRecord[] = [
    { id: 1, name: 'Painting', slug: 'painting', description: 'Original oils, gouache, and acrylic compositions', imageUrl: '/artwork/after-the-rain.jpg', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 2, name: 'Sculpture', slug: 'sculpture', description: 'Hand-built ceramic forms, vessels, and tactile stoneware', imageUrl: '/artwork/tidal-form.jpg', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 3, name: 'Photography', slug: 'photography', description: 'Limited-edition archival pigment prints and fine art studies', imageUrl: '/artwork/quiet-room.jpg', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 4, name: 'Prints', slug: 'prints', description: 'Hand-signed lithographs, screenprints, and mixed editions', imageUrl: '/artwork/soft-architecture.jpg', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  ];

  const seedArtworks: ArtworkRecord[] = [
    {
      id: 1,
      artistId: 1,
      title: 'After the Rain',
      slug: 'after-the-rain',
      description: 'Soft greens and washed blues settle into the last light of a summer storm.',
      price: 560,
      currency: 'USD',
      category: 'Painting',
      medium: 'Oil and cold wax on linen',
      dimensions: '60 × 80 cm',
      yearCreated: 2025,
      status: 'published',
      imageUrls: ['/artwork/after-the-rain.jpg'],
      artworkType: 'original',
      featured: true,
      quantity: 1,
      views: 310,
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
    },
    {
      id: 2,
      artistId: 2,
      title: 'Blue Hour No. 4',
      slug: 'blue-hour-no-4',
      description: 'A study of evening light, built up in translucent layers of pigment.',
      price: 420,
      currency: 'USD',
      category: 'Painting',
      medium: 'Acrylic and graphite on canvas',
      dimensions: '50 × 70 cm',
      yearCreated: 2025,
      status: 'published',
      imageUrls: ['/artwork/blue-hour.jpg'],
      artworkType: 'original',
      featured: true,
      quantity: 1,
      views: 245,
      createdAt: '2025-01-22T10:00:00Z',
      updatedAt: '2025-01-22T10:00:00Z',
    },
    {
      id: 3,
      artistId: 3,
      title: 'Citrus Study',
      slug: 'citrus-study',
      description: 'A bright, measured arrangement of fruit, paper, and shifting shadows.',
      price: 320,
      currency: 'USD',
      category: 'Painting',
      medium: 'Gouache on cotton paper',
      dimensions: '30 × 42 cm',
      yearCreated: 2024,
      status: 'published',
      imageUrls: ['/artwork/citrus-study.jpg'],
      artworkType: 'original',
      featured: false,
      quantity: 1,
      views: 180,
      createdAt: '2025-01-23T10:00:00Z',
      updatedAt: '2025-01-23T10:00:00Z',
    },
    {
      id: 4,
      artistId: 3,
      title: 'Tidal Form',
      slug: 'tidal-form',
      description: 'A hand-built ceramic form with an irregular, salt-like glaze.',
      price: 720,
      currency: 'USD',
      category: 'Sculpture',
      medium: 'Stoneware with satin glaze',
      dimensions: '24 × 18 × 15 cm',
      yearCreated: 2025,
      status: 'published',
      imageUrls: ['/artwork/tidal-form.jpg'],
      artworkType: 'original',
      featured: true,
      quantity: 1,
      views: 420,
      createdAt: '2025-01-24T10:00:00Z',
      updatedAt: '2025-01-24T10:00:00Z',
    },
    {
      id: 5,
      artistId: 4,
      title: 'Quiet Room',
      slug: 'quiet-room',
      description: 'A calm interior, photographed in the spare light of early morning.',
      price: 280,
      currency: 'USD',
      category: 'Photography',
      medium: 'Archival pigment print',
      dimensions: '40 × 50 cm',
      yearCreated: 2024,
      status: 'published',
      imageUrls: ['/artwork/quiet-room.jpg'],
      artworkType: 'print',
      featured: false,
      quantity: 25,
      views: 195,
      createdAt: '2025-01-25T10:00:00Z',
      updatedAt: '2025-01-25T10:00:00Z',
    },
    {
      id: 6,
      artistId: 2,
      title: 'Soft Architecture',
      slug: 'soft-architecture',
      description: 'Rounded planes and hand-drawn edges turn a city block into a memory.',
      price: 480,
      currency: 'USD',
      category: 'Painting',
      medium: 'Oil and pastel on panel',
      dimensions: '45 × 60 cm',
      yearCreated: 2025,
      status: 'published',
      imageUrls: ['/artwork/soft-architecture.jpg'],
      artworkType: 'original',
      featured: false,
      quantity: 1,
      views: 210,
      createdAt: '2025-01-26T10:00:00Z',
      updatedAt: '2025-01-26T10:00:00Z',
    },
    {
      id: 7,
      artistId: 1,
      title: 'Wild Garden',
      slug: 'wild-garden',
      description: 'An expressive garden scene, alive with color and loose, layered brushwork.',
      price: 640,
      currency: 'USD',
      category: 'Painting',
      medium: 'Oil on linen',
      dimensions: '70 × 90 cm',
      yearCreated: 2025,
      status: 'published',
      imageUrls: ['/artwork/wild-garden.jpg'],
      artworkType: 'original',
      featured: true,
      quantity: 1,
      views: 390,
      createdAt: '2025-01-27T10:00:00Z',
      updatedAt: '2025-01-27T10:00:00Z',
    },
    {
      id: 8,
      artistId: 3,
      title: 'Folded Vessel',
      slug: 'folded-vessel',
      description: 'A sculptural paper study translated into a small, tactile ceramic vessel.',
      price: 350,
      currency: 'USD',
      category: 'Sculpture',
      medium: 'Hand-built porcelain',
      dimensions: '19 × 16 × 13 cm',
      yearCreated: 2024,
      status: 'published',
      imageUrls: ['/artwork/folded-vessel.jpg'],
      artworkType: 'original',
      featured: false,
      quantity: 1,
      views: 270,
      createdAt: '2025-01-28T10:00:00Z',
      updatedAt: '2025-01-28T10:00:00Z',
    },
  ];

  const seedUsers: UserRecord[] = [
    { id: 'usr_forma_collector', role: 'buyer', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'usr_mira_sen', role: 'artist', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'usr_admin_curator', role: 'admin', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  ];

  const seedReviews: ReviewRecord[] = [
    {
      id: 1,
      artworkId: 1,
      artistId: 1,
      userId: 'usr_forma_collector',
      rating: 5,
      title: 'Exquisite brushwork and depth',
      comment: 'Arrived impeccably crated and framed. The texture in person is even more mesmerizing than photographed.',
      verifiedPurchase: true,
      createdAt: '2025-02-01T14:30:00Z',
    },
    {
      id: 2,
      artworkId: 4,
      artistId: 3,
      userId: 'usr_forma_collector',
      rating: 5,
      title: 'Stunning ceramic centerpiece',
      comment: 'The salt glaze is tactile and delicate. A true museum-worthy piece.',
      verifiedPurchase: true,
      createdAt: '2025-02-15T09:15:00Z',
    },
  ];

  return {
    users: seedUsers,
    buyerProfiles: [
      {
        id: 1,
        userId: 'usr_forma_collector',
        displayName: 'Elena Rostova',
        bio: 'Contemporary collector focusing on textured oils and ceramics.',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ],
    artistProfiles: seedArtists,
    categories: seedCategories,
    artworks: seedArtworks,
    cartItems: [],
    wishlist: [
      { id: 1, userId: 'usr_forma_collector', artworkId: 1, createdAt: '2025-02-01T00:00:00Z' },
      { id: 2, userId: 'usr_forma_collector', artworkId: 4, createdAt: '2025-02-02T00:00:00Z' },
    ],
    follows: [
      { id: 1, userId: 'usr_forma_collector', artistId: 1, createdAt: '2025-02-01T00:00:00Z' },
      { id: 2, userId: 'usr_forma_collector', artistId: 3, createdAt: '2025-02-02T00:00:00Z' },
    ],
    orders: [
      {
        id: 1001,
        userId: 'usr_forma_collector',
        status: 'delivered',
        paymentStatus: 'paid',
        subtotal: 560,
        shipping: 0,
        tax: 0,
        total: 560,
        currency: 'USD',
        fullName: 'Elena Rostova',
        email: 'elena@forma.gallery',
        phone: '+1 (555) 234-8901',
        address1: '450 West 24th Street',
        address2: 'Apt 8B',
        city: 'New York',
        region: 'NY',
        postalCode: '10011',
        country: 'United States',
        createdAt: '2025-02-01T12:00:00Z',
        updatedAt: '2025-02-05T16:00:00Z',
      },
    ],
    orderItems: [
      {
        id: 1,
        orderId: 1001,
        artworkId: 1,
        artistId: 1,
        title: 'After the Rain',
        quantity: 1,
        unitPrice: 560,
        commissionRate: 10,
        commissionAmount: 56,
        artistAmount: 504,
      },
    ],
    payments: [
      {
        id: 1,
        orderId: 1001,
        amount: 560,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: 'card',
        createdAt: '2025-02-01T12:01:00Z',
      },
    ],
    payouts: [
      {
        id: 1,
        artistId: 1,
        orderId: 1001,
        amount: 504,
        currency: 'USD',
        status: 'paid',
        payoutDate: '2025-02-07T10:00:00Z',
        referenceNumber: 'PO-2025-001',
        notes: 'Payout for Order #1001 (After the Rain) less 10% platform commission',
        createdAt: '2025-02-06T10:00:00Z',
        updatedAt: '2025-02-07T10:00:00Z',
      },
    ],
    settings: {
      commissionRate: 10.0, // 10% commission
      currency: 'USD',
      autoApproveArtworks: false,
      minPayoutAmount: 50,
      updatedAt: '2025-01-01T00:00:00Z',
    },
    reviews: seedReviews,
    conversations: [
      {
        id: 1,
        buyerId: 'usr_forma_collector',
        artistId: 1,
        artworkId: 1,
        lastMessageAt: '2025-02-01T11:45:00Z',
        createdAt: '2025-02-01T11:00:00Z',
      },
    ],
    messages: [
      {
        id: 1,
        conversationId: 1,
        senderId: 'usr_forma_collector',
        content: 'Hi Mira, could you tell me if After the Rain is ready to hang?',
        isRead: true,
        createdAt: '2025-02-01T11:00:00Z',
      },
      {
        id: 2,
        conversationId: 1,
        senderId: 'usr_mira_sen',
        content: 'Hello Elena! Yes, it is fitted with heavy-gauge hanging wire and ships in a custom wooden crate.',
        isRead: true,
        createdAt: '2025-02-01T11:45:00Z',
      },
    ],
    notifications: [
      {
        id: 1,
        userId: 'usr_forma_collector',
        type: 'order_update',
        title: 'Order Delivered',
        message: 'Your order #1001 "After the Rain" was delivered.',
        link: '/account',
        isRead: true,
        createdAt: '2025-02-05T16:00:00Z',
      },
    ],
  };
}

class MarketplaceStore {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed reading storage file, initializing defaults:', e);
    }
    const initial = getInitialState();
    this.saveState(initial);
    return initial;
  }

  private saveState(state: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed saving storage file:', e);
    }
  }

  private persist() {
    this.saveState(this.state);
  }

  // --- Users & Roles ---
  getUser(userId: string): UserRecord | null {
    return this.state.users.find((u) => u.id === userId) || null;
  }

  ensureUser(userId: string, defaultRole: 'buyer' | 'artist' | 'admin' = 'unset'): UserRecord {
    let user = this.getUser(userId);
    if (!user) {
      user = {
        id: userId,
        role: defaultRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.users.push(user);
      this.persist();
    }
    return user;
  }

  setUserRole(userId: string, role: 'buyer' | 'artist' | 'admin'): UserRecord {
    const user = this.ensureUser(userId);
    user.role = role;
    user.updatedAt = new Date().toISOString();
    this.persist();
    return user;
  }

  listUsers(): UserRecord[] {
    return this.state.users;
  }

  // --- Artists ---
  getArtistById(id: number): ArtistProfileRecord | null {
    return this.state.artistProfiles.find((a) => a.id === id) || null;
  }

  getArtistBySlug(slug: string): ArtistProfileRecord | null {
    return this.state.artistProfiles.find((a) => a.slug === slug) || null;
  }

  getArtistByUserId(userId: string): ArtistProfileRecord | null {
    return this.state.artistProfiles.find((a) => a.userId === userId) || null;
  }

  listArtists(): ArtistProfileRecord[] {
    return this.state.artistProfiles;
  }

  updateArtistProfile(userId: string, data: Partial<ArtistProfileRecord>): ArtistProfileRecord {
    let artist = this.getArtistByUserId(userId);
    if (!artist) {
      const id = this.state.artistProfiles.length ? Math.max(...this.state.artistProfiles.map((a) => a.id)) + 1 : 1;
      const slug = data.slug || (data.displayName ? data.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `artist-${id}`);
      artist = {
        id,
        userId,
        displayName: data.displayName || 'Artist',
        slug,
        location: data.location || '',
        biography: data.biography || '',
        imageUrl: data.imageUrl || '/artwork/after-the-rain.jpg',
        website: data.website || null,
        rating: 5.0,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.artistProfiles.push(artist);
    } else {
      Object.assign(artist, data, { updatedAt: new Date().toISOString() });
    }
    this.persist();
    return artist;
  }

  // --- Artworks ---
  getArtworkById(id: number): ArtworkRecord | null {
    return this.state.artworks.find((a) => a.id === id) || null;
  }

  getArtworkBySlug(slug: string): ArtworkRecord | null {
    return this.state.artworks.find((a) => a.slug === slug) || null;
  }

  listArtworks(filters?: {
    q?: string;
    category?: string;
    artistId?: number;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): { items: ArtworkRecord[]; total: number; page: number; limit: number; totalPages: number } {
    let list = [...this.state.artworks];

    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    } else {
      // By default for public queries, return published artworks
      list = list.filter((a) => a.status === 'published');
    }

    if (filters?.artistId) {
      list = list.filter((a) => a.artistId === filters.artistId);
    }

    if (filters?.category) {
      const cat = filters.category.toLowerCase().trim();
      list = list.filter((a) => a.category.toLowerCase() === cat);
    }

    if (filters?.q) {
      const q = filters.q.toLowerCase().trim();
      list = list.filter((a) => {
        const artist = this.getArtistById(a.artistId);
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.medium.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (artist && artist.displayName.toLowerCase().includes(q))
        );
      });
    }

    if (filters?.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (filters?.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (filters?.sort === 'newest') {
      list.sort((a, b) => b.id - a.id);
    } else if (filters?.sort === 'popular') {
      list.sort((a, b) => b.views - a.views);
    }

    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(48, Math.max(1, filters?.limit || 24));
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const items = list.slice((page - 1) * limit, page * limit);

    return { items, total, page, limit, totalPages };
  }

  createArtwork(artistId: number, data: Omit<ArtworkRecord, 'id' | 'artistId' | 'createdAt' | 'updatedAt' | 'views'>): ArtworkRecord {
    const id = this.state.artworks.length ? Math.max(...this.state.artworks.map((a) => a.id)) + 1 : 1;
    const slug = data.slug || `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
    const newArt: ArtworkRecord = {
      id,
      artistId,
      title: data.title,
      slug,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'USD',
      category: data.category || 'Painting',
      medium: data.medium || 'Mixed Media',
      dimensions: data.dimensions || '50 × 60 cm',
      yearCreated: Number(data.yearCreated) || new Date().getFullYear(),
      status: data.status || 'published',
      imageUrls: data.imageUrls?.length ? data.imageUrls : ['/artwork/after-the-rain.jpg'],
      artworkType: data.artworkType || 'original',
      featured: Boolean(data.featured),
      quantity: data.quantity !== undefined ? Number(data.quantity) : 1,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.artworks.unshift(newArt);
    this.persist();
    return newArt;
  }

  updateArtwork(id: number, data: Partial<ArtworkRecord>): ArtworkRecord | null {
    const art = this.getArtworkById(id);
    if (!art) return null;
    Object.assign(art, data, { updatedAt: new Date().toISOString() });
    this.persist();
    return art;
  }

  deleteArtwork(id: number): boolean {
    const index = this.state.artworks.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.state.artworks.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Categories ---
  listCategories(): CategoryRecord[] {
    return this.state.categories;
  }

  createCategory(name: string, description = '', imageUrl?: string): CategoryRecord {
    const id = this.state.categories.length ? Math.max(...this.state.categories.map((c) => c.id)) + 1 : 1;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat: CategoryRecord = {
      id,
      name,
      slug,
      description,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.categories.push(cat);
    this.persist();
    return cat;
  }

  updateCategory(id: number, data: Partial<CategoryRecord>): CategoryRecord | null {
    const cat = this.state.categories.find((c) => c.id === id);
    if (!cat) return null;
    Object.assign(cat, data, { updatedAt: new Date().toISOString() });
    this.persist();
    return cat;
  }

  deleteCategory(id: number): boolean {
    const idx = this.state.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.state.categories.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Cart ---
  getCart(userId: string) {
    const items = this.state.cartItems
      .filter((c) => c.userId === userId)
      .map((c) => {
        const artwork = this.getArtworkById(c.artworkId);
        const artist = artwork ? this.getArtistById(artwork.artistId) : null;
        const imageUrls = Array.isArray(artwork?.imageUrls) && artwork!.imageUrls.length
          ? artwork!.imageUrls
          : [artwork?.imageUrl || '/artwork/after-the-rain.jpg'];
        const unitPrice = artwork ? artwork.price : 0;
        return {
          id: c.id,
          artworkId: c.artworkId,
          artwork: artwork
            ? {
                ...artwork,
                imageUrl: imageUrls[0] || '/artwork/after-the-rain.jpg',
                imageUrls,
                artist: artist || {
                  id: 0,
                  displayName: 'Unknown Artist',
                  slug: 'unknown',
                  location: '',
                  biography: '',
                  imageUrl: '',
                  followerCount: 0,
                  artworkCount: 0,
                  rating: 0,
                },
              }
            : null,
          quantity: c.quantity,
          price: unitPrice,
          lineTotal: unitPrice * c.quantity,
        };
      })
      .filter((i) => i.artwork !== null);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 250 || items.length === 0 ? 0 : 25;
    return {
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      currency: 'USD',
    };
  }

  addToCart(userId: string, artworkId: number, quantity = 1) {
    const existing = this.state.cartItems.find((c) => c.userId === userId && c.artworkId === artworkId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const id = this.state.cartItems.length ? Math.max(...this.state.cartItems.map((c) => c.id)) + 1 : 1;
      this.state.cartItems.push({
        id,
        userId,
        artworkId,
        quantity,
        createdAt: new Date().toISOString(),
      });
    }
    this.persist();
    return this.getCart(userId);
  }

  updateCartQuantity(userId: string, artworkIdOrItemId: number, quantity: number) {
    const item = this.state.cartItems.find(
      (c) => c.userId === userId && (c.artworkId === artworkIdOrItemId || c.id === artworkIdOrItemId)
    );
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(userId, artworkIdOrItemId);
      } else {
        item.quantity = quantity;
        this.persist();
      }
    }
    return this.getCart(userId);
  }

  removeFromCart(userId: string, artworkIdOrItemId: number) {
    this.state.cartItems = this.state.cartItems.filter(
      (c) => !(c.userId === userId && (c.artworkId === artworkIdOrItemId || c.id === artworkIdOrItemId))
    );
    this.persist();
    return this.getCart(userId);
  }

  clearCart(userId: string) {
    this.state.cartItems = this.state.cartItems.filter((c) => c.userId !== userId);
    this.persist();
  }

  // --- Wishlist ---
  getWishlist(userId: string): ArtworkRecord[] {
    const artworkIds = this.state.wishlist.filter((w) => w.userId === userId).map((w) => w.artworkId);
    return this.state.artworks.filter((a) => artworkIds.includes(a.id));
  }

  addToWishlist(userId: string, artworkId: number) {
    if (!this.state.wishlist.some((w) => w.userId === userId && w.artworkId === artworkId)) {
      const id = this.state.wishlist.length ? Math.max(...this.state.wishlist.map((w) => w.id)) + 1 : 1;
      this.state.wishlist.push({
        id,
        userId,
        artworkId,
        createdAt: new Date().toISOString(),
      });
      this.persist();
    }
  }

  removeFromWishlist(userId: string, artworkId: number) {
    this.state.wishlist = this.state.wishlist.filter((w) => !(w.userId === userId && w.artworkId === artworkId));
    this.persist();
  }

  // --- Follows ---
  getFollowedArtists(userId: string): ArtistProfileRecord[] {
    const artistIds = this.state.follows.filter((f) => f.userId === userId).map((f) => f.artistId);
    return this.state.artistProfiles.filter((a) => artistIds.includes(a.id));
  }

  followArtist(userId: string, artistId: number) {
    if (!this.state.follows.some((f) => f.userId === userId && f.artistId === artistId)) {
      const id = this.state.follows.length ? Math.max(...this.state.follows.map((f) => f.id)) + 1 : 1;
      this.state.follows.push({
        id,
        userId,
        artistId,
        createdAt: new Date().toISOString(),
      });
      const artist = this.getArtistById(artistId);
      if (artist) artist.views += 1;
      this.persist();
    }
  }

  unfollowArtist(userId: string, artistId: number) {
    this.state.follows = this.state.follows.filter((f) => !(f.userId === userId && f.artistId === artistId));
    this.persist();
  }

  // --- Orders & Commission ---
  createOrder(data: {
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
    address1: string;
    address2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    stripeSessionId?: string;
  }): { order: OrderRecord; items: OrderItemRecord[] } {
    const cart = this.getCart(data.userId);
    if (!cart.items.length) {
      throw new Error('Cart is empty');
    }

    // Check inventory
    for (const item of cart.items) {
      const artwork = this.getArtworkById(item.artworkId);
      if (!artwork || (artwork.quantity < item.quantity && artwork.artworkType === 'original' && artwork.quantity < 1)) {
        throw new Error(`Insufficient inventory for "${artwork?.title || 'artwork'}"`);
      }
    }

    const orderId = this.state.orders.length ? Math.max(...this.state.orders.map((o) => o.id)) + 1 : 1001;
    const commissionRate = this.state.settings.commissionRate; // e.g. 10.0%

    const orderItems: OrderItemRecord[] = [];
    for (const item of cart.items) {
      const itemId = this.state.orderItems.length + orderItems.length + 1;
      const unitPrice = item.price;
      const qty = item.quantity;
      const lineSubtotal = unitPrice * qty;
      const commissionAmount = Math.round(lineSubtotal * (commissionRate / 100) * 100) / 100;
      const artistAmount = Math.round((lineSubtotal - commissionAmount) * 100) / 100;

      orderItems.push({
        id: itemId,
        orderId,
        artworkId: item.artworkId,
        artistId: item.artwork ? item.artwork.artist.id : 1,
        title: item.artwork ? item.artwork.title : 'Artwork',
        quantity: qty,
        unitPrice,
        commissionRate,
        commissionAmount,
        artistAmount,
      });
    }

    const newOrder: OrderRecord = {
      id: orderId,
      userId: data.userId,
      stripeSessionId: data.stripeSessionId,
      status: 'confirmed',
      paymentStatus: 'paid',
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: 0,
      total: cart.total,
      currency: cart.currency,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      country: data.country,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItems,
    };

    // Reduce inventory on successful confirmation
    for (const item of cart.items) {
      const art = this.getArtworkById(item.artworkId);
      if (art) {
        art.quantity = Math.max(0, art.quantity - item.quantity);
        if (art.quantity === 0 && art.artworkType === 'original') {
          art.status = 'sold';
        }
      }
    }

    this.state.orders.unshift(newOrder);
    this.state.orderItems.push(...orderItems);

    // Create payment record
    const paymentId = this.state.payments.length + 1;
    this.state.payments.push({
      id: paymentId,
      orderId,
      amount: cart.total,
      currency: cart.currency,
      status: 'succeeded',
      paymentMethod: 'card',
      createdAt: new Date().toISOString(),
    });

    // Create pending artist payouts for each item
    for (const item of orderItems) {
      const payoutId = this.state.payouts.length + 1;
      this.state.payouts.push({
        id: payoutId,
        artistId: item.artistId,
        orderId,
        amount: item.artistAmount,
        currency: cart.currency,
        status: 'pending',
        notes: `Earnings from Order #${orderId} for "${item.title}" (${100 - commissionRate}% share)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Clear cart
    this.clearCart(data.userId);

    this.persist();
    return { order: newOrder, items: orderItems };
  }

  getOrderById(id: number): OrderRecord | null {
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) return null;
    const items = this.state.orderItems.filter((i) => i.orderId === id);
    return { ...order, items };
  }

  listUserOrders(userId: string): OrderRecord[] {
    return this.state.orders
      .filter((o) => o.userId === userId)
      .map((o) => ({
        ...o,
        items: this.state.orderItems.filter((i) => i.orderId === o.id),
      }));
  }

  listArtistOrders(artistId: number): Array<OrderItemRecord & { order: OrderRecord }> {
    const items = this.state.orderItems.filter((i) => i.artistId === artistId);
    return items.map((i) => {
      const order = this.state.orders.find((o) => o.id === i.orderId)!;
      return { ...i, order };
    });
  }

  getArtistEarnings(artistId: number) {
    const items = this.state.orderItems.filter((i) => i.artistId === artistId);
    const totalSales = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const totalCommission = items.reduce((acc, i) => acc + i.commissionAmount, 0);
    const netEarnings = items.reduce((acc, i) => acc + i.artistAmount, 0);

    const payouts = this.state.payouts.filter((p) => p.artistId === artistId);
    const paidOut = payouts.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
    const pendingPayout = payouts.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

    return {
      totalSales,
      totalCommission,
      netEarnings,
      paidOut,
      pendingPayout,
      ordersCount: items.length,
      payouts,
    };
  }

  listAllOrders(): OrderRecord[] {
    return this.state.orders.map((o) => ({
      ...o,
      items: this.state.orderItems.filter((i) => i.orderId === o.id),
    }));
  }

  // --- Settings & Commission ---
  getSettings(): SettingsRecord {
    return this.state.settings;
  }

  updateSettings(data: Partial<SettingsRecord>): SettingsRecord {
    Object.assign(this.state.settings, data, { updatedAt: new Date().toISOString() });
    this.persist();
    return this.state.settings;
  }

  // --- Payouts ---
  listPayouts(): PayoutRecord[] {
    return this.state.payouts;
  }

  updatePayoutStatus(id: number, status: 'pending' | 'processing' | 'paid' | 'failed', ref?: string): PayoutRecord | null {
    const payout = this.state.payouts.find((p) => p.id === id);
    if (!payout) return null;
    payout.status = status;
    if (ref) payout.referenceNumber = ref;
    if (status === 'paid') payout.payoutDate = new Date().toISOString();
    payout.updatedAt = new Date().toISOString();
    this.persist();
    return payout;
  }
}

export const store = new MarketplaceStore();
