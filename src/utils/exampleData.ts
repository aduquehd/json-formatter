export const exampleJsonData: Record<string, string> = {
  ecommerce: JSON.stringify({
    catalog: {
      metadata: {
        totalProducts: 15,
        lastUpdated: "2025-08-03T10:30:00Z",
        currency: "USD",
        storeId: "store_main_001"
      },
      categories: [
        {
          id: "cat_electronics",
          name: "Electronics",
          subcategories: [
            "Audio",
            "Computing",
            "Mobile",
            "Gaming"
          ]
        },
        {
          id: "cat_clothing",
          name: "Clothing",
          subcategories: [
            "Men",
            "Women",
            "Kids",
            "Accessories"
          ]
        },
        {
          id: "cat_home",
          name: "Home & Garden",
          subcategories: [
            "Furniture",
            "Appliances",
            "Decor",
            "Tools"
          ]
        },
        {
          id: "cat_books",
          name: "Books",
          subcategories: [
            "Fiction",
            "Non-fiction",
            "Technical",
            "Children"
          ]
        },
        {
          id: "cat_sports",
          name: "Sports & Outdoors",
          subcategories: [
            "Fitness",
            "Outdoor",
            "Team Sports",
            "Water Sports"
          ]
        }
      ],
      products: [
        {
          id: "prod_001",
          sku: "WBH-2024-BLK",
          name: "Wireless Bluetooth Headphones",
          category: "cat_electronics",
          subcategory: "Audio",
          brand: "AudioTech",
          price: 89.99,
          originalPrice: 129.99,
          discount: 30.77,
          inStock: true,
          inventory: 45,
          reserved: 3,
          sold: 234,
          rating: 4.5,
          reviewCount: 127,
          specifications: {
            batteryLife: "30 hours",
            chargingTime: "2 hours",
            weight: "250g",
            connectivity: [
              "Bluetooth 5.0",
              "USB-C",
              "3.5mm Jack"
            ],
            features: [
              "noise-canceling",
              "water-resistant",
              "foldable"
            ],
            colors: [
              "black",
              "white",
              "blue",
              "red"
            ],
            warranty: "2 years"
          },
          dimensions: {
            length: 20.5,
            width: 18,
            height: 8.5,
            unit: "cm"
          },
          tags: [
            "wireless",
            "noise-canceling",
            "portable",
            "premium"
          ],
          releaseDate: "2024-03-15T00:00:00Z",
          supplier: {
            id: "sup_001",
            name: "TechSupply Inc.",
            country: "Taiwan",
            leadTime: 14
          }
        },
        {
          id: "prod_002",
          sku: "COF-ORG-COL",
          name: "Organic Colombian Coffee Beans",
          category: "cat_home",
          subcategory: "Appliances",
          brand: "Mountain Roast",
          price: 24.5,
          originalPrice: 24.5,
          discount: 0,
          inStock: false,
          inventory: 0,
          reserved: 0,
          sold: 89,
          rating: 4.8,
          reviewCount: 89,
          specifications: {
            origin: "Colombia",
            roastLevel: "Medium",
            weight: "1kg",
            grindType: "Whole Bean",
            certifications: [
              "Organic",
              "Fair Trade",
              "Rainforest Alliance"
            ],
            flavorNotes: [
              "chocolate",
              "caramel",
              "citrus"
            ],
            acidityLevel: "Medium",
            caffeineContent: "High"
          },
          dimensions: {
            length: 15,
            width: 8,
            height: 25,
            unit: "cm"
          },
          tags: [
            "organic",
            "fair-trade",
            "premium",
            "colombian"
          ],
          releaseDate: "2024-01-10T00:00:00Z",
          supplier: {
            id: "sup_002",
            name: "Colombian Farms Co.",
            country: "Colombia",
            leadTime: 21
          }
        },
        {
          id: "prod_003",
          sku: "LAP-GAM-RTX",
          name: "Gaming Laptop RTX 4070",
          category: "cat_electronics",
          subcategory: "Computing",
          brand: "GameForce",
          price: 1299.99,
          originalPrice: 1499.99,
          discount: 13.33,
          inStock: true,
          inventory: 12,
          reserved: 2,
          sold: 67,
          rating: 4.7,
          reviewCount: 43,
          specifications: {
            processor: "Intel i7-13700H",
            graphics: "RTX 4070 8GB",
            ram: "16GB DDR5",
            storage: "1TB NVMe SSD",
            display: "15.6 inch 144Hz",
            resolution: "1920x1080",
            ports: [
              "USB-A x3",
              "USB-C x2",
              "HDMI",
              "Ethernet"
            ],
            battery: "80Wh",
            os: "Windows 11",
            weight: "2.4kg"
          },
          dimensions: {
            length: 35.9,
            width: 25.9,
            height: 2.39,
            unit: "cm"
          },
          tags: [
            "gaming",
            "laptop",
            "rtx",
            "high-performance"
          ],
          releaseDate: "2024-06-01T00:00:00Z",
          supplier: {
            id: "sup_003",
            name: "Tech Components Ltd.",
            country: "China",
            leadTime: 10
          }
        },
        {
          id: "prod_004",
          sku: "TSH-COT-BLU-M",
          name: "Cotton T-Shirt Blue Medium",
          category: "cat_clothing",
          subcategory: "Men",
          brand: "ComfortWear",
          price: 19.99,
          originalPrice: 24.99,
          discount: 20.01,
          inStock: true,
          inventory: 156,
          reserved: 8,
          sold: 445,
          rating: 4.2,
          reviewCount: 203,
          specifications: {
            material: "100% Cotton",
            fit: "Regular",
            sizes: [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
            ],
            colors: [
              "blue",
              "white",
              "black",
              "gray",
              "red"
            ],
            careInstructions: [
              "Machine wash cold",
              "Tumble dry low",
              "Do not bleach"
            ],
            origin: "Bangladesh",
            sustainabilityCert: "GOTS Certified"
          },
          dimensions: {
            chest: 102,
            length: 71,
            sleeve: 20,
            unit: "cm"
          },
          tags: [
            "cotton",
            "casual",
            "basic",
            "sustainable"
          ],
          releaseDate: "2024-02-20T00:00:00Z",
          supplier: {
            id: "sup_004",
            name: "Textile Solutions",
            country: "Bangladesh",
            leadTime: 28
          }
        },
        {
          id: "prod_005",
          sku: "CHR-OFF-ERG",
          name: "Ergonomic Office Chair",
          category: "cat_home",
          subcategory: "Furniture",
          brand: "ErgoSeating",
          price: 349.99,
          originalPrice: 449.99,
          discount: 22.22,
          inStock: true,
          inventory: 23,
          reserved: 1,
          sold: 78,
          rating: 4.6,
          reviewCount: 91,
          specifications: {
            material: "Mesh back, fabric seat",
            adjustments: [
              "Height",
              "Armrests",
              "Lumbar support",
              "Tilt"
            ],
            weightCapacity: "120kg",
            assembly: "Required",
            warranty: "5 years",
            colors: [
              "black",
              "gray",
              "white"
            ],
            certification: "GREENGUARD Gold"
          },
          dimensions: {
            width: 68,
            depth: 68,
            height: 122,
            unit: "cm"
          },
          tags: [
            "ergonomic",
            "office",
            "adjustable",
            "mesh"
          ],
          releaseDate: "2024-04-05T00:00:00Z",
          supplier: {
            id: "sup_005",
            name: "Furniture Direct",
            country: "Germany",
            leadTime: 15
          }
        },
        {
          id: "prod_006",
          sku: "BOO-FIC-MYS",
          name: "The Midnight Detective - Mystery Novel",
          category: "cat_books",
          subcategory: "Fiction",
          brand: "Penguin Random House",
          price: 14.99,
          originalPrice: 16.99,
          discount: 11.77,
          inStock: true,
          inventory: 87,
          reserved: 5,
          sold: 234,
          rating: 4.4,
          reviewCount: 156,
          specifications: {
            author: "Sarah Mitchell",
            isbn: "978-0-123456-78-9",
            pages: 342,
            language: "English",
            publisher: "Penguin Random House",
            format: "Paperback",
            genre: "Mystery/Thriller",
            publicationDate: "2024-01-15"
          },
          dimensions: {
            width: 12.9,
            height: 19.8,
            thickness: 2.1,
            unit: "cm"
          },
          tags: [
            "mystery",
            "thriller",
            "bestseller",
            "fiction"
          ],
          releaseDate: "2024-01-15T00:00:00Z",
          supplier: {
            id: "sup_006",
            name: "Book Distribution Co.",
            country: "United States",
            leadTime: 7
          }
        },
        {
          id: "prod_007",
          sku: "YOG-MAT-PRP",
          name: "Premium Yoga Mat Purple",
          category: "cat_sports",
          subcategory: "Fitness",
          brand: "ZenFlex",
          price: 39.99,
          originalPrice: 49.99,
          discount: 20,
          inStock: true,
          inventory: 67,
          reserved: 3,
          sold: 123,
          rating: 4.3,
          reviewCount: 89,
          specifications: {
            material: "TPE (Thermoplastic Elastomer)",
            thickness: "6mm",
            texture: "Non-slip surface",
            size: "183cm x 61cm",
            weight: "1.2kg",
            colors: [
              "purple",
              "blue",
              "green",
              "pink",
              "black"
            ],
            features: [
              "eco-friendly",
              "odor-free",
              "easy-clean"
            ],
            includes: "Carrying strap"
          },
          dimensions: {
            length: 183,
            width: 61,
            thickness: 0.6,
            unit: "cm"
          },
          tags: [
            "yoga",
            "fitness",
            "eco-friendly",
            "non-slip"
          ],
          releaseDate: "2024-03-01T00:00:00Z",
          supplier: {
            id: "sup_007",
            name: "Fitness Equipment Pro",
            country: "Taiwan",
            leadTime: 12
          }
        },
        {
          id: "prod_008",
          sku: "SMA-PHN-5G",
          name: "Smartphone 5G 128GB",
          category: "cat_electronics",
          subcategory: "Mobile",
          brand: "TechPhone",
          price: 699.99,
          originalPrice: 799.99,
          discount: 12.5,
          inStock: true,
          inventory: 34,
          reserved: 7,
          sold: 189,
          rating: 4.5,
          reviewCount: 267,
          specifications: {
            display: "6.7 inch OLED",
            resolution: "2400x1080",
            processor: "Snapdragon 8 Gen 2",
            storage: "128GB",
            ram: "8GB",
            camera: {
              rear: "50MP + 12MP + 8MP",
              front: "32MP"
            },
            battery: "4500mAh",
            charging: "65W fast charging",
            os: "Android 14",
            connectivity: [
              "5G",
              "WiFi 6",
              "Bluetooth 5.3"
            ],
            colors: [
              "black",
              "white",
              "blue",
              "gold"
            ]
          },
          dimensions: {
            height: 16.28,
            width: 7.54,
            thickness: 0.79,
            unit: "cm"
          },
          tags: [
            "smartphone",
            "5g",
            "android",
            "camera"
          ],
          releaseDate: "2024-05-10T00:00:00Z",
          supplier: {
            id: "sup_008",
            name: "Mobile Tech Supply",
            country: "South Korea",
            leadTime: 8
          }
        },
        {
          id: "prod_009",
          sku: "KIT-CHF-ST",
          name: "Professional Chef Knife Set",
          category: "cat_home",
          subcategory: "Appliances",
          brand: "CulinaryPro",
          price: 129.99,
          originalPrice: 159.99,
          discount: 18.75,
          inStock: true,
          inventory: 41,
          reserved: 2,
          sold: 156,
          rating: 4.7,
          reviewCount: 124,
          specifications: {
            material: "High-carbon stainless steel",
            handle: "Ergonomic polymer",
            pieces: 8,
            includes: [
              "8-inch chef knife",
              "6-inch utility knife",
              "4-inch paring knife",
              "3-inch peeling knife",
              "Kitchen shears",
              "Honing steel",
              "Knife block",
              "User manual"
            ],
            sharpness: "Razor sharp",
            maintenance: "Hand wash recommended",
            warranty: "Lifetime"
          },
          dimensions: {
            blockWidth: 20,
            blockDepth: 12,
            blockHeight: 23,
            unit: "cm"
          },
          tags: [
            "kitchen",
            "knives",
            "professional",
            "cooking"
          ],
          releaseDate: "2024-02-28T00:00:00Z",
          supplier: {
            id: "sup_009",
            name: "Kitchen Supplies Inc.",
            country: "Japan",
            leadTime: 16
          }
        },
        {
          id: "prod_010",
          sku: "SNK-RUN-WHT-42",
          name: "Running Sneakers White Size 42",
          category: "cat_clothing",
          subcategory: "Accessories",
          brand: "RunFast",
          price: 89.99,
          originalPrice: 109.99,
          discount: 18.18,
          inStock: true,
          inventory: 78,
          reserved: 4,
          sold: 298,
          rating: 4.4,
          reviewCount: 187,
          specifications: {
            material: "Mesh upper, rubber sole",
            technology: "Air cushioning",
            weight: "280g per shoe",
            sizes: [
              "38",
              "39",
              "40",
              "41",
              "42",
              "43",
              "44",
              "45"
            ],
            colors: [
              "white",
              "black",
              "gray",
              "blue",
              "red"
            ],
            features: [
              "breathable",
              "lightweight",
              "shock-absorbing"
            ],
            sport: "Running",
            terrain: "Road"
          },
          dimensions: {
            length: 30.5,
            width: 11.2,
            height: 12.8,
            unit: "cm"
          },
          tags: [
            "running",
            "sneakers",
            "athletic",
            "comfortable"
          ],
          releaseDate: "2024-04-20T00:00:00Z",
          supplier: {
            id: "sup_010",
            name: "Sports Footwear Ltd.",
            country: "Vietnam",
            leadTime: 20
          }
        },
        {
          id: "prod_011",
          sku: "GAM-CON-PS5",
          name: "Gaming Controller PS5 Compatible",
          category: "cat_electronics",
          subcategory: "Gaming",
          brand: "GameControl",
          price: 59.99,
          originalPrice: 69.99,
          discount: 14.29,
          inStock: true,
          inventory: 93,
          reserved: 6,
          sold: 267,
          rating: 4.2,
          reviewCount: 143,
          specifications: {
            compatibility: [
              "PS5",
              "PC",
              "Mobile"
            ],
            connectivity: [
              "Bluetooth",
              "USB-C"
            ],
            battery: "1200mAh",
            batteryLife: "12 hours",
            features: [
              "haptic feedback",
              "adaptive triggers",
              "motion sensor"
            ],
            colors: [
              "black",
              "white",
              "blue",
              "red"
            ],
            weight: "280g",
            charging: "USB-C fast charging"
          },
          dimensions: {
            length: 16,
            width: 10.6,
            height: 6.2,
            unit: "cm"
          },
          tags: [
            "gaming",
            "controller",
            "ps5",
            "wireless"
          ],
          releaseDate: "2024-06-15T00:00:00Z",
          supplier: {
            id: "sup_011",
            name: "Gaming Accessories Co.",
            country: "China",
            leadTime: 11
          }
        },
        {
          id: "prod_012",
          sku: "WAT-BOT-ST",
          name: "Stainless Steel Water Bottle",
          category: "cat_sports",
          subcategory: "Outdoor",
          brand: "HydroFlask",
          price: 29.99,
          originalPrice: 34.99,
          discount: 14.29,
          inStock: true,
          inventory: 124,
          reserved: 8,
          sold: 445,
          rating: 4.6,
          reviewCount: 234,
          specifications: {
            material: "18/8 stainless steel",
            capacity: "750ml",
            insulation: "Double wall vacuum",
            temperature: "Cold 24h, Hot 12h",
            features: [
              "leak-proof",
              "sweat-free",
              "BPA-free"
            ],
            colors: [
              "silver",
              "black",
              "blue",
              "green",
              "pink"
            ],
            cap: "Sport cap with straw",
            weight: "350g"
          },
          dimensions: {
            height: 27.5,
            diameter: 7.3,
            unit: "cm"
          },
          tags: [
            "water",
            "bottle",
            "insulated",
            "sports"
          ],
          releaseDate: "2024-01-05T00:00:00Z",
          supplier: {
            id: "sup_012",
            name: "Outdoor Gear Pro",
            country: "United States",
            leadTime: 9
          }
        },
        {
          id: "prod_013",
          sku: "DES-LAM-LED",
          name: "LED Desk Lamp Adjustable",
          category: "cat_home",
          subcategory: "Decor",
          brand: "BrightLight",
          price: 45.99,
          originalPrice: 55.99,
          discount: 17.86,
          inStock: true,
          inventory: 56,
          reserved: 2,
          sold: 98,
          rating: 4.3,
          reviewCount: 67,
          specifications: {
            lighting: "LED",
            brightness: "500 lumens",
            colorTemp: "3000K-6500K adjustable",
            power: "12W",
            features: [
              "touch control",
              "memory function",
              "USB charging port"
            ],
            adjustment: "360° rotation, height adjustable",
            materials: "Aluminum alloy, ABS plastic",
            colors: [
              "white",
              "black",
              "silver"
            ],
            warranty: "3 years"
          },
          dimensions: {
            baseWidth: 18,
            baseDepth: 18,
            maxHeight: 45,
            unit: "cm"
          },
          tags: [
            "desk",
            "lamp",
            "led",
            "adjustable"
          ],
          releaseDate: "2024-03-25T00:00:00Z",
          supplier: {
            id: "sup_013",
            name: "Lighting Solutions Ltd.",
            country: "China",
            leadTime: 13
          }
        },
        {
          id: "prod_014",
          sku: "BAC-LEA-BLK",
          name: "Leather Backpack Black",
          category: "cat_clothing",
          subcategory: "Accessories",
          brand: "UrbanCarry",
          price: 79.99,
          originalPrice: 99.99,
          discount: 20,
          inStock: true,
          inventory: 34,
          reserved: 3,
          sold: 167,
          rating: 4.5,
          reviewCount: 89,
          specifications: {
            material: "Genuine leather",
            capacity: "25 liters",
            compartments: 3,
            laptopSlot: "Up to 15.6 inch",
            features: [
              "water-resistant",
              "anti-theft zippers",
              "USB charging port"
            ],
            colors: [
              "black",
              "brown",
              "navy"
            ],
            weight: "1.2kg",
            warranty: "2 years"
          },
          dimensions: {
            height: 42,
            width: 30,
            depth: 15,
            unit: "cm"
          },
          tags: [
            "backpack",
            "leather",
            "laptop",
            "professional"
          ],
          releaseDate: "2024-02-10T00:00:00Z",
          supplier: {
            id: "sup_014",
            name: "Leather Goods Inc.",
            country: "India",
            leadTime: 18
          }
        },
        {
          id: "prod_015",
          sku: "PLN-SUC-MIX",
          name: "Succulent Plants Mixed Set",
          category: "cat_home",
          subcategory: "Decor",
          brand: "GreenThumb",
          price: 34.99,
          originalPrice: 39.99,
          discount: 12.5,
          inStock: true,
          inventory: 67,
          reserved: 5,
          sold: 156,
          rating: 4.7,
          reviewCount: 112,
          specifications: {
            varieties: [
              "Echeveria",
              "Jade Plant",
              "Aloe Vera",
              "String of Pearls",
              "Haworthia"
            ],
            potSize: "6cm diameter",
            quantity: 5,
            careLevel: "Easy",
            sunlight: "Bright indirect",
            watering: "Once per week",
            includes: "Care instructions",
            lifespan: "Several years with proper care"
          },
          dimensions: {
            potDiameter: 6,
            potHeight: 6,
            plantHeight: 8,
            unit: "cm"
          },
          tags: [
            "plants",
            "succulents",
            "indoor",
            "low-maintenance"
          ],
          releaseDate: "2024-04-01T00:00:00Z",
          supplier: {
            id: "sup_015",
            name: "Garden Center Co.",
            country: "Netherlands",
            leadTime: 5
          }
        }
      ]
    }
  }, null, 2),

  userProfile: JSON.stringify({
    user: {
      id: "usr_789456123",
      username: "johndoe",
      email: "john.doe@example.com",
      fullName: "John Michael Doe",
      dateOfBirth: "1990-05-15",
      phoneNumber: "+1-555-0123",
      emailVerified: true,
      twoFactorEnabled: true,
      accountCreated: "2021-03-10T14:30:00Z",
      lastLogin: "2025-08-03T09:15:30Z",
      accountType: "premium",
      subscriptionExpiry: "2025-12-31T23:59:59Z",
      profileImage: "https://api.example.com/users/789456123/avatar.jpg",
      bio: "Software developer, tech enthusiast, coffee lover",
      location: {
        city: "San Francisco",
        state: "California",
        country: "United States",
        timezone: "America/Los_Angeles",
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
      preferences: {
        language: "en-US",
        currency: "USD",
        theme: "dark",
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false,
        },
        privacy: {
          profileVisibility: "friends",
          showEmail: false,
          showPhone: false,
          allowDataCollection: true,
        },
      },
      socialProfiles: [
        {
          platform: "LinkedIn",
          url: "https://linkedin.com/in/johndoe",
          verified: true,
        },
        {
          platform: "GitHub",
          url: "https://github.com/johndoe",
          verified: true,
        },
        {
          platform: "Twitter",
          url: "https://twitter.com/johndoe",
          verified: false,
        },
      ],
      stats: {
        postsCount: 145,
        followersCount: 1234,
        followingCount: 567,
        likesReceived: 3456,
        commentsCount: 789,
        achievementPoints: 2500,
        level: 15,
      },
      achievements: [
        {
          id: "ach_001",
          name: "Early Adopter",
          description: "Joined within the first year",
          unlockedAt: "2021-03-10T14:30:00Z",
          icon: "star",
          rarity: "rare",
        },
        {
          id: "ach_002",
          name: "Contributor",
          description: "Made 100+ contributions",
          unlockedAt: "2023-07-22T10:45:00Z",
          icon: "trophy",
          rarity: "uncommon",
        },
        {
          id: "ach_003",
          name: "Social Butterfly",
          description: "Connected 3+ social accounts",
          unlockedAt: "2022-11-15T16:20:00Z",
          icon: "butterfly",
          rarity: "common",
        },
      ],
      activityHistory: [
        {
          id: "act_001",
          type: "post",
          action: "created",
          timestamp: "2025-08-02T14:30:00Z",
          details: {
            postId: "post_456",
            title: "Understanding TypeScript Generics",
          },
        },
        {
          id: "act_002",
          type: "comment",
          action: "posted",
          timestamp: "2025-08-01T18:45:00Z",
          details: {
            commentId: "com_789",
            postId: "post_123",
            content: "Great article! Very helpful.",
          },
        },
        {
          id: "act_003",
          type: "follow",
          action: "followed",
          timestamp: "2025-07-30T10:20:00Z",
          details: {
            userId: "usr_456789",
            username: "techguru",
          },
        },
      ],
      settings: {
        security: {
          sessionTimeout: 30,
          loginAlerts: true,
          ipWhitelist: [],
          trustedDevices: [
            {
              id: "dev_001",
              name: "MacBook Pro",
              type: "laptop",
              lastAccess: "2025-08-03T09:15:30Z",
            },
            {
              id: "dev_002",
              name: "iPhone 14",
              type: "mobile",
              lastAccess: "2025-08-02T22:30:00Z",
            },
          ],
        },
        api: {
          enabled: true,
          key: "api_key_xxxxxxxxxxxxx",
          rateLimit: 1000,
          webhooks: [
            {
              url: "https://api.example.com/webhook",
              events: ["post.created", "comment.created"],
              active: true,
            },
          ],
        },
      },
    },
  }, null, 2),

  financialSales: JSON.stringify({
    company: {
      name: "TechCorp Solutions Inc.",
      fiscalYear: 2024,
      currency: "USD",
      reportingPeriod: "Q1-Q4 2024",
      lastUpdated: "2025-01-15T09:00:00Z"
    },
    summary: {
      totalRevenue: 45670000.5,
      totalCosts: 28940000.25,
      grossProfit: 16729999.25,
      netProfit: 12890000.75,
      profitMargin: 28.24,
      totalTransactions: 8456,
      averageOrderValue: 5398.58,
      topPerformingRegion: "North America",
      topPerformingProduct: "Enterprise Software License"
    },
    quarterlyPerformance: [
      {
        quarter: "Q1",
        period: "2024-01-01 to 2024-03-31",
        revenue: 10450000.25,
        costs: 6580000.5,
        profit: 3869999.75,
        transactions: 1867,
        averageOrderValue: 5596.78,
        growthRate: 12.5
      },
      {
        quarter: "Q2",
        period: "2024-04-01 to 2024-06-30",
        revenue: 11890000.75,
        costs: 7320000.25,
        profit: 4569999.5,
        transactions: 2134,
        averageOrderValue: 5570.42,
        growthRate: 13.8
      },
      {
        quarter: "Q3",
        period: "2024-07-01 to 2024-09-30",
        revenue: 12340000,
        costs: 7680000,
        profit: 4659999,
        transactions: 2289,
        averageOrderValue: 5391.24,
        growthRate: 3.8
      },
      {
        quarter: "Q4",
        period: "2024-10-01 to 2024-12-31",
        revenue: 10989999.5,
        costs: 7360000.5,
        profit: 3629999,
        transactions: 2166,
        averageOrderValue: 5072.16,
        growthRate: -10.9
      }
    ],
    productLines: [
      {
        id: "pl_001",
        name: "Enterprise Software License",
        category: "Software",
        totalRevenue: 18560000,
        totalSales: 1245,
        averagePrice: 14911.65,
        marketShare: 40.6,
        monthlySales: [
          { month: "January", revenue: 1650000, units: 115 },
          { month: "February", revenue: 1480000, units: 98 },
          { month: "March", revenue: 1820000, units: 132 },
          { month: "April", revenue: 1590000, units: 108 },
          { month: "May", revenue: 1750000, units: 119 },
          { month: "June", revenue: 1680000, units: 114 },
          { month: "July", revenue: 1430000, units: 97 },
          { month: "August", revenue: 1520000, units: 103 },
          { month: "September", revenue: 1410000, units: 95 },
          { month: "October", revenue: 1360000, units: 92 },
          { month: "November", revenue: 1440000, units: 98 },
          { month: "December", revenue: 1420000, units: 93 }
        ]
      },
      {
        id: "pl_002",
        name: "Cloud Hosting Services",
        category: "Services",
        totalRevenue: 12340000,
        totalSales: 2876,
        averagePrice: 4290.17,
        marketShare: 27,
        monthlySales: [
          { month: "January", revenue: 980000, units: 234 },
          { month: "February", revenue: 1050000, units: 245 },
          { month: "March", revenue: 1120000, units: 267 },
          { month: "April", revenue: 1080000, units: 251 },
          { month: "May", revenue: 1150000, units: 278 },
          { month: "June", revenue: 1090000, units: 256 },
          { month: "July", revenue: 1040000, units: 243 },
          { month: "August", revenue: 1070000, units: 248 },
          { month: "September", revenue: 980000, units: 234 },
          { month: "October", revenue: 920000, units: 215 },
          { month: "November", revenue: 950000, units: 223 },
          { month: "December", revenue: 900000, units: 212 }
        ]
      },
      {
        id: "pl_003",
        name: "Technical Support Contracts",
        category: "Services",
        totalRevenue: 8970000.5,
        totalSales: 3456,
        averagePrice: 2595.63,
        marketShare: 19.6,
        monthlySales: [
          { month: "January", revenue: 750000, units: 289 },
          { month: "February", revenue: 780000, units: 298 },
          { month: "March", revenue: 820000, units: 312 },
          { month: "April", revenue: 790000, units: 305 },
          { month: "May", revenue: 810000, units: 315 },
          { month: "June", revenue: 760000, units: 294 },
          { month: "July", revenue: 740000, units: 286 },
          { month: "August", revenue: 770000, units: 296 },
          { month: "September", revenue: 720000.5, units: 278 },
          { month: "October", revenue: 680000, units: 264 },
          { month: "November", revenue: 700000, units: 271 },
          { month: "December", revenue: 650000, units: 253 }
        ]
      },
      {
        id: "pl_004",
        name: "Hardware Solutions",
        category: "Hardware",
        totalRevenue: 5800000,
        totalSales: 879,
        averagePrice: 6597.95,
        marketShare: 12.7,
        monthlySales: [
          { month: "January", revenue: 520000, units: 78 },
          { month: "February", revenue: 480000, units: 71 },
          { month: "March", revenue: 550000, units: 83 },
          { month: "April", revenue: 510000, units: 76 },
          { month: "May", revenue: 490000, units: 73 },
          { month: "June", revenue: 470000, units: 70 },
          { month: "July", revenue: 460000, units: 69 },
          { month: "August", revenue: 480000, units: 72 },
          { month: "September", revenue: 440000, units: 66 },
          { month: "October", revenue: 420000, units: 63 },
          { month: "November", revenue: 450000, units: 67 },
          { month: "December", revenue: 430000, units: 65 }
        ]
      }
    ],
    regionalPerformance: [
      {
        region: "North America",
        countries: ["United States", "Canada", "Mexico"],
        totalRevenue: 19870000.75,
        marketShare: 43.5,
        customerCount: 3456,
        averageOrderValue: 5748.27,
        topProducts: ["Enterprise Software License", "Cloud Hosting Services"],
        quarterlyGrowth: [8.5, 12.3, 6.7, -5.2]
      },
      {
        region: "Europe",
        countries: ["Germany", "United Kingdom", "France", "Netherlands", "Spain"],
        totalRevenue: 13450000.25,
        marketShare: 29.5,
        customerCount: 2789,
        averageOrderValue: 4823.91,
        topProducts: ["Technical Support Contracts", "Cloud Hosting Services"],
        quarterlyGrowth: [15.2, 18.7, 4.1, -8.9]
      },
      {
        region: "Asia Pacific",
        countries: ["Japan", "Australia", "Singapore", "South Korea"],
        totalRevenue: 8340000,
        marketShare: 18.3,
        customerCount: 1567,
        averageOrderValue: 5323.15,
        topProducts: ["Enterprise Software License", "Hardware Solutions"],
        quarterlyGrowth: [22.1, 19.8, 12.4, -3.7]
      },
      {
        region: "Latin America",
        countries: ["Brazil", "Argentina", "Chile", "Colombia"],
        totalRevenue: 2890000.5,
        marketShare: 6.3,
        customerCount: 456,
        averageOrderValue: 6338.16,
        topProducts: ["Cloud Hosting Services", "Technical Support Contracts"],
        quarterlyGrowth: [28.5, 31.2, 18.9, 12.4]
      },
      {
        region: "Middle East & Africa",
        countries: ["UAE", "South Africa", "Saudi Arabia"],
        totalRevenue: 1120000,
        marketShare: 2.5,
        customerCount: 188,
        averageOrderValue: 5957.45,
        topProducts: ["Enterprise Software License", "Hardware Solutions"],
        quarterlyGrowth: [45.2, 38.7, 25.1, 18.9]
      }
    ],
    salesTeamPerformance: [
      {
        employeeId: "EMP001",
        name: "Sarah Johnson",
        position: "Senior Sales Manager",
        region: "North America",
        totalSales: 2450000,
        dealsClosed: 67,
        averageDealSize: 36567.16,
        quota: 2200000,
        quotaAttainment: 111.4,
        commission: 98000,
        monthlyPerformance: [
          { month: "January", sales: 215000, deals: 6 },
          { month: "February", sales: 189000, deals: 5 },
          { month: "March", sales: 234000, deals: 7 },
          { month: "April", sales: 201000, deals: 5 },
          { month: "May", sales: 223000, deals: 6 },
          { month: "June", sales: 198000, deals: 5 },
          { month: "July", sales: 187000, deals: 5 },
          { month: "August", sales: 209000, deals: 6 },
          { month: "September", sales: 192000, deals: 5 },
          { month: "October", sales: 178000, deals: 4 },
          { month: "November", sales: 195000, deals: 6 },
          { month: "December", sales: 229000, deals: 7 }
        ]
      },
      {
        employeeId: "EMP002",
        name: "Michael Chen",
        position: "Sales Representative",
        region: "Asia Pacific",
        totalSales: 1890000,
        dealsClosed: 123,
        averageDealSize: 15365.85,
        quota: 1800000,
        quotaAttainment: 105,
        commission: 75600,
        monthlyPerformance: [
          { month: "January", sales: 167000, deals: 11 },
          { month: "February", sales: 145000, deals: 9 },
          { month: "March", sales: 178000, deals: 12 },
          { month: "April", sales: 156000, deals: 10 },
          { month: "May", sales: 169000, deals: 11 },
          { month: "June", sales: 151000, deals: 10 },
          { month: "July", sales: 143000, deals: 9 },
          { month: "August", sales: 158000, deals: 10 },
          { month: "September", sales: 147000, deals: 9 },
          { month: "October", sales: 134000, deals: 8 },
          { month: "November", sales: 149000, deals: 12 },
          { month: "December", sales: 153000, deals: 12 }
        ]
      },
      {
        employeeId: "EMP003",
        name: "Emma Rodriguez",
        position: "Account Manager",
        region: "Europe",
        totalSales: 1567000.5,
        dealsClosed: 89,
        averageDealSize: 17607.87,
        quota: 1500000,
        quotaAttainment: 104.5,
        commission: 62680,
        monthlyPerformance: [
          { month: "January", sales: 134000, deals: 8 },
          { month: "February", sales: 128000, deals: 7 },
          { month: "March", sales: 145000.5, deals: 9 },
          { month: "April", sales: 132000, deals: 7 },
          { month: "May", sales: 139000, deals: 8 },
          { month: "June", sales: 125000, deals: 7 },
          { month: "July", sales: 119000, deals: 6 },
          { month: "August", sales: 127000, deals: 7 },
          { month: "September", sales: 121000, deals: 6 },
          { month: "October", sales: 115000, deals: 6 },
          { month: "November", sales: 123000, deals: 8 },
          { month: "December", sales: 135000, deals: 10 }
        ]
      },
      {
        employeeId: "EMP004",
        name: "David Thompson",
        position: "Sales Representative",
        region: "North America",
        totalSales: 1234000,
        dealsClosed: 156,
        averageDealSize: 7910.26,
        quota: 1200000,
        quotaAttainment: 102.8,
        commission: 49360,
        monthlyPerformance: [
          { month: "January", sales: 108000, deals: 14 },
          { month: "February", sales: 95000, deals: 12 },
          { month: "March", sales: 116000, deals: 15 },
          { month: "April", sales: 102000, deals: 13 },
          { month: "May", sales: 109000, deals: 14 },
          { month: "June", sales: 98000, deals: 12 },
          { month: "July", sales: 92000, deals: 11 },
          { month: "August", sales: 105000, deals: 13 },
          { month: "September", sales: 99000, deals: 12 },
          { month: "October", sales: 89000, deals: 11 },
          { month: "November", sales: 101000, deals: 14 },
          { month: "December", sales: 120000, deals: 15 }
        ]
      },
      {
        employeeId: "EMP005",
        name: "Lisa Wang",
        position: "Regional Sales Director",
        region: "Asia Pacific",
        totalSales: 3120000,
        dealsClosed: 45,
        averageDealSize: 69333.33,
        quota: 2800000,
        quotaAttainment: 111.4,
        commission: 124800,
        monthlyPerformance: [
          { month: "January", sales: 285000, deals: 4 },
          { month: "February", sales: 245000, deals: 3 },
          { month: "March", sales: 310000, deals: 5 },
          { month: "April", sales: 268000, deals: 4 },
          { month: "May", sales: 295000, deals: 4 },
          { month: "June", sales: 252000, deals: 3 },
          { month: "July", sales: 238000, deals: 3 },
          { month: "August", sales: 267000, deals: 4 },
          { month: "September", sales: 243000, deals: 3 },
          { month: "October", sales: 225000, deals: 3 },
          { month: "November", sales: 256000, deals: 4 },
          { month: "December", sales: 276000, deals: 5 }
        ]
      }
    ],
    customerSegments: [
      {
        segment: "Enterprise",
        customerCount: 234,
        totalRevenue: 28340000,
        averageRevenue: 121111.11,
        percentageOfTotal: 62.1,
        retentionRate: 94.5,
        topProducts: ["Enterprise Software License", "Technical Support Contracts"]
      },
      {
        segment: "Mid-Market",
        customerCount: 567,
        totalRevenue: 12890000.5,
        averageRevenue: 22727.6,
        percentageOfTotal: 28.2,
        retentionRate: 87.3,
        topProducts: ["Cloud Hosting Services", "Technical Support Contracts"]
      },
      {
        segment: "Small Business",
        customerCount: 1234,
        totalRevenue: 4440000,
        averageRevenue: 3598.22,
        percentageOfTotal: 9.7,
        retentionRate: 78.9,
        topProducts: ["Cloud Hosting Services", "Hardware Solutions"]
      }
    ],
    expensesBreakdown: [
      {
        category: "Sales & Marketing",
        amount: 8970000,
        percentage: 31,
        subcategories: [
          { name: "Sales Commissions", amount: 3456000 },
          { name: "Marketing Campaigns", amount: 2890000 },
          { name: "Sales Team Salaries", amount: 1890000 },
          { name: "Trade Shows & Events", amount: 734000 }
        ]
      },
      {
        category: "Research & Development",
        amount: 7560000,
        percentage: 26.1,
        subcategories: [
          { name: "Software Development", amount: 4320000 },
          { name: "R&D Salaries", amount: 2340000 },
          { name: "Technology Infrastructure", amount: 900000 }
        ]
      },
      {
        category: "Operations",
        amount: 6780000.25,
        percentage: 23.4,
        subcategories: [
          { name: "Cloud Infrastructure", amount: 2890000 },
          { name: "Support Staff Salaries", amount: 2340000.25 },
          { name: "Office Rent & Utilities", amount: 890000 },
          { name: "Equipment & Software", amount: 660000 }
        ]
      },
      {
        category: "General & Administrative",
        amount: 5630000,
        percentage: 19.5,
        subcategories: [
          { name: "Executive Salaries", amount: 2340000 },
          { name: "Legal & Compliance", amount: 1230000 },
          { name: "Finance & Accounting", amount: 1120000 },
          { name: "Insurance & Benefits", amount: 940000 }
        ]
      }
    ],
    keyMetrics: {
      monthlyRecurringRevenue: 3805833.38,
      annualRecurringRevenue: 45670000.5,
      customerAcquisitionCost: 3421.5,
      customerLifetimeValue: 89567.25,
      churnRate: 8.7,
      netPromoterScore: 67,
      salesCycleLength: 89,
      leadConversionRate: 23.4,
      averageContractLength: 24
    }
  }, null, 2),

  geographicData: JSON.stringify({
    capitals: [
      { name: "Kabul", country: "Afghanistan", latitude: 34.5553, longitude: 69.2075, population: 4600000, timezone: "Asia/Kabul" },
      { name: "Tirana", country: "Albania", latitude: 41.3275, longitude: 19.8189, population: 920000, timezone: "Europe/Tirane" },
      { name: "Algiers", country: "Algeria", latitude: 36.7372, longitude: 3.0865, population: 3415811, timezone: "Africa/Algiers" },
      { name: "Andorra la Vella", country: "Andorra", latitude: 42.5078, longitude: 1.5211, population: 22886, timezone: "Europe/Andorra" },
      { name: "Luanda", country: "Angola", latitude: -8.8368, longitude: 13.2343, population: 8330000, timezone: "Africa/Luanda" },
      { name: "Saint John's", country: "Antigua and Barbuda", latitude: 17.1175, longitude: -61.8456, population: 22219, timezone: "America/Antigua" },
      { name: "Buenos Aires", country: "Argentina", latitude: -34.6037, longitude: -58.3816, population: 15369919, timezone: "America/Argentina/Buenos_Aires" },
      { name: "Yerevan", country: "Armenia", latitude: 40.1792, longitude: 44.4991, population: 1075800, timezone: "Asia/Yerevan" },
      { name: "Canberra", country: "Australia", latitude: -35.2809, longitude: 149.1300, population: 462213, timezone: "Australia/Sydney" },
      { name: "Vienna", country: "Austria", latitude: 48.2082, longitude: 16.3738, population: 1973403, timezone: "Europe/Vienna" },
      { name: "Baku", country: "Azerbaijan", latitude: 40.4093, longitude: 49.8671, population: 2300500, timezone: "Asia/Baku" },
      { name: "Nassau", country: "Bahamas", latitude: 25.0480, longitude: -77.3554, population: 274400, timezone: "America/Nassau" },
      { name: "Manama", country: "Bahrain", latitude: 26.2285, longitude: 50.5860, population: 709000, timezone: "Asia/Bahrain" },
      { name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125, population: 21741000, timezone: "Asia/Dhaka" },
      { name: "Bridgetown", country: "Barbados", latitude: 13.0969, longitude: -59.6145, population: 110000, timezone: "America/Barbados" },
      { name: "Minsk", country: "Belarus", latitude: 53.9006, longitude: 27.5590, population: 2009786, timezone: "Europe/Minsk" },
      { name: "Brussels", country: "Belgium", latitude: 50.8503, longitude: 4.3517, population: 1218255, timezone: "Europe/Brussels" },
      { name: "Belmopan", country: "Belize", latitude: 17.2514, longitude: -88.7590, population: 20621, timezone: "America/Belize" },
      { name: "Porto-Novo", country: "Benin", latitude: 6.4969, longitude: 2.6289, population: 264320, timezone: "Africa/Porto-Novo" },
      { name: "Thimphu", country: "Bhutan", latitude: 27.4728, longitude: 89.6393, population: 114551, timezone: "Asia/Thimphu" },
      { name: "Sucre", country: "Bolivia", latitude: -19.0354, longitude: -65.2592, population: 300000, timezone: "America/La_Paz" },
      { name: "Sarajevo", country: "Bosnia and Herzegovina", latitude: 43.8564, longitude: 18.4131, population: 419957, timezone: "Europe/Sarajevo" },
      { name: "Gaborone", country: "Botswana", latitude: -24.6282, longitude: 25.9231, population: 246325, timezone: "Africa/Gaborone" },
      { name: "Brasília", country: "Brazil", latitude: -15.7975, longitude: -47.8919, population: 3055149, timezone: "America/Sao_Paulo" },
      { name: "Bandar Seri Begawan", country: "Brunei", latitude: 4.9031, longitude: 114.9398, population: 100700, timezone: "Asia/Brunei" },
      { name: "Sofia", country: "Bulgaria", latitude: 42.6977, longitude: 23.3219, population: 1307376, timezone: "Europe/Sofia" },
      { name: "Ouagadougou", country: "Burkina Faso", latitude: 12.3714, longitude: -1.5197, population: 2453496, timezone: "Africa/Ouagadougou" },
      { name: "Gitega", country: "Burundi", latitude: -3.4264, longitude: 29.9306, population: 135467, timezone: "Africa/Bujumbura" },
      { name: "Praia", country: "Cabo Verde", latitude: 14.9331, longitude: -23.5133, population: 167361, timezone: "Atlantic/Cape_Verde" },
      { name: "Phnom Penh", country: "Cambodia", latitude: 11.5564, longitude: 104.9282, population: 2129371, timezone: "Asia/Phnom_Penh" },
      { name: "Yaoundé", country: "Cameroon", latitude: 3.8480, longitude: 11.5021, population: 4164167, timezone: "Africa/Douala" },
      { name: "Ottawa", country: "Canada", latitude: 45.4215, longitude: -75.6972, population: 1017449, timezone: "America/Toronto" },
      { name: "Bangui", country: "Central African Republic", latitude: 4.3947, longitude: 18.5582, population: 889231, timezone: "Africa/Bangui" },
      { name: "N'Djamena", country: "Chad", latitude: 12.1348, longitude: 15.0557, population: 1605696, timezone: "Africa/Ndjamena" },
      { name: "Santiago", country: "Chile", latitude: -33.4489, longitude: -70.6693, population: 6680202, timezone: "America/Santiago" },
      { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074, population: 21893095, timezone: "Asia/Shanghai" },
      { name: "Bogotá", country: "Colombia", latitude: 4.7110, longitude: -74.0721, population: 7412566, timezone: "America/Bogota" },
      { name: "Moroni", country: "Comoros", latitude: -11.7045, longitude: 43.2551, population: 111329, timezone: "Indian/Comoro" },
      { name: "Kinshasa", country: "Congo (DRC)", latitude: -4.4419, longitude: 15.2663, population: 14970460, timezone: "Africa/Kinshasa" },
      { name: "Brazzaville", country: "Congo (Republic)", latitude: -4.2634, longitude: 15.2429, population: 2388090, timezone: "Africa/Brazzaville" },
      { name: "San José", country: "Costa Rica", latitude: 9.9281, longitude: -84.0907, population: 342188, timezone: "America/Costa_Rica" },
      { name: "Zagreb", country: "Croatia", latitude: 45.8150, longitude: 15.9819, population: 806341, timezone: "Europe/Zagreb" },
      { name: "Havana", country: "Cuba", latitude: 23.1136, longitude: -82.3666, population: 2135498, timezone: "America/Havana" },
      { name: "Nicosia", country: "Cyprus", latitude: 35.1856, longitude: 33.3823, population: 116161, timezone: "Asia/Nicosia" },
      { name: "Prague", country: "Czech Republic", latitude: 50.0755, longitude: 14.4378, population: 1357326, timezone: "Europe/Prague" },
      { name: "Copenhagen", country: "Denmark", latitude: 55.6761, longitude: 12.5683, population: 656987, timezone: "Europe/Copenhagen" },
      { name: "Djibouti", country: "Djibouti", latitude: 11.5721, longitude: 43.1456, population: 603869, timezone: "Africa/Djibouti" },
      { name: "Roseau", country: "Dominica", latitude: 15.3092, longitude: -61.3794, population: 14725, timezone: "America/Dominica" },
      { name: "Santo Domingo", country: "Dominican Republic", latitude: 18.4861, longitude: -69.9312, population: 3339410, timezone: "America/Santo_Domingo" },
      { name: "Quito", country: "Ecuador", latitude: -0.1807, longitude: -78.4678, population: 1978376, timezone: "America/Guayaquil" },
      { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, population: 10100166, timezone: "Africa/Cairo" },
      { name: "San Salvador", country: "El Salvador", latitude: 13.6929, longitude: -89.2182, population: 1106681, timezone: "America/El_Salvador" },
      { name: "Malabo", country: "Equatorial Guinea", latitude: 3.7504, longitude: 8.7371, population: 297000, timezone: "Africa/Malabo" },
      { name: "Asmara", country: "Eritrea", latitude: 15.3229, longitude: 38.9251, population: 963000, timezone: "Africa/Asmara" },
      { name: "Tallinn", country: "Estonia", latitude: 59.4370, longitude: 24.7536, population: 454532, timezone: "Europe/Tallinn" },
      { name: "Mbabane", country: "Eswatini", latitude: -26.3054, longitude: 31.1367, population: 94874, timezone: "Africa/Mbabane" },
      { name: "Addis Ababa", country: "Ethiopia", latitude: 8.9806, longitude: 38.7578, population: 3859000, timezone: "Africa/Addis_Ababa" },
      { name: "Suva", country: "Fiji", latitude: -18.1416, longitude: 178.4415, population: 88271, timezone: "Pacific/Fiji" },
      { name: "Helsinki", country: "Finland", latitude: 60.1699, longitude: 24.9384, population: 658864, timezone: "Europe/Helsinki" },
      { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, population: 2165423, timezone: "Europe/Paris" },
      { name: "Libreville", country: "Gabon", latitude: 0.4162, longitude: 9.4673, population: 797003, timezone: "Africa/Libreville" },
      { name: "Banjul", country: "Gambia", latitude: 13.4549, longitude: -16.5790, population: 437000, timezone: "Africa/Banjul" },
      { name: "Tbilisi", country: "Georgia", latitude: 41.7151, longitude: 44.8271, population: 1118035, timezone: "Asia/Tbilisi" },
      { name: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050, population: 3769495, timezone: "Europe/Berlin" },
      { name: "Accra", country: "Ghana", latitude: 5.6037, longitude: -0.1870, population: 2514000, timezone: "Africa/Accra" },
      { name: "Athens", country: "Greece", latitude: 37.9838, longitude: 23.7275, population: 664046, timezone: "Europe/Athens" },
      { name: "Saint George's", country: "Grenada", latitude: 12.0561, longitude: -61.7488, population: 7500, timezone: "America/Grenada" },
      { name: "Guatemala City", country: "Guatemala", latitude: 14.6349, longitude: -90.5069, population: 2934841, timezone: "America/Guatemala" },
      { name: "Conakry", country: "Guinea", latitude: 9.6412, longitude: -13.5784, population: 2064000, timezone: "Africa/Conakry" },
      { name: "Bissau", country: "Guinea-Bissau", latitude: 11.8636, longitude: -15.5977, population: 579150, timezone: "Africa/Bissau" },
      { name: "Georgetown", country: "Guyana", latitude: 6.8013, longitude: -58.1551, population: 355000, timezone: "America/Guyana" },
      { name: "Port-au-Prince", country: "Haiti", latitude: 18.5944, longitude: -72.3074, population: 2618894, timezone: "America/Port-au-Prince" },
      { name: "Tegucigalpa", country: "Honduras", latitude: 14.0723, longitude: -87.1921, population: 1259646, timezone: "America/Tegucigalpa" },
      { name: "Budapest", country: "Hungary", latitude: 47.4979, longitude: 19.0402, population: 1752286, timezone: "Europe/Budapest" },
      { name: "Reykjavik", country: "Iceland", latitude: 64.1466, longitude: -21.9426, population: 135688, timezone: "Atlantic/Reykjavik" },
      { name: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.2090, population: 32941000, timezone: "Asia/Kolkata" },
      { name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456, population: 10770487, timezone: "Asia/Jakarta" },
      { name: "Tehran", country: "Iran", latitude: 35.6892, longitude: 51.3890, population: 9259000, timezone: "Asia/Tehran" },
      { name: "Baghdad", country: "Iraq", latitude: 33.3152, longitude: 44.3661, population: 8765000, timezone: "Asia/Baghdad" },
      { name: "Dublin", country: "Ireland", latitude: 53.3498, longitude: -6.2603, population: 592713, timezone: "Europe/Dublin" },
      { name: "Jerusalem", country: "Israel", latitude: 31.7683, longitude: 35.2137, population: 936425, timezone: "Asia/Jerusalem" },
      { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964, population: 2860009, timezone: "Europe/Rome" },
      { name: "Kingston", country: "Jamaica", latitude: 17.9712, longitude: -76.7936, population: 1243072, timezone: "America/Jamaica" },
      { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, population: 13960000, timezone: "Asia/Tokyo" },
      { name: "Amman", country: "Jordan", latitude: 31.9454, longitude: 35.9284, population: 4678000, timezone: "Asia/Amman" },
      { name: "Astana", country: "Kazakhstan", latitude: 51.1694, longitude: 71.4491, population: 1165983, timezone: "Asia/Almaty" },
      { name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219, population: 5118844, timezone: "Africa/Nairobi" },
      { name: "Tarawa", country: "Kiribati", latitude: 1.3291, longitude: 172.9763, population: 56388, timezone: "Pacific/Tarawa" },
      { name: "Pristina", country: "Kosovo", latitude: 42.6629, longitude: 21.1655, population: 216870, timezone: "Europe/Belgrade" },
      { name: "Kuwait City", country: "Kuwait", latitude: 29.3759, longitude: 47.9774, population: 4500000, timezone: "Asia/Kuwait" },
      { name: "Bishkek", country: "Kyrgyzstan", latitude: 42.8746, longitude: 74.5698, population: 1053900, timezone: "Asia/Bishkek" },
      { name: "Vientiane", country: "Laos", latitude: 17.9757, longitude: 102.6331, population: 948477, timezone: "Asia/Vientiane" },
      { name: "Riga", country: "Latvia", latitude: 56.9496, longitude: 24.1052, population: 605273, timezone: "Europe/Riga" },
      { name: "Beirut", country: "Lebanon", latitude: 33.8938, longitude: 35.5018, population: 2385000, timezone: "Asia/Beirut" },
      { name: "Maseru", country: "Lesotho", latitude: -29.3151, longitude: 27.4869, population: 330760, timezone: "Africa/Maseru" },
      { name: "Monrovia", country: "Liberia", latitude: 6.2907, longitude: -10.7605, population: 1477000, timezone: "Africa/Monrovia" },
      { name: "Tripoli", country: "Libya", latitude: 32.8872, longitude: 13.1913, population: 3088000, timezone: "Africa/Tripoli" },
      { name: "Vaduz", country: "Liechtenstein", latitude: 47.1410, longitude: 9.5209, population: 5696, timezone: "Europe/Vaduz" },
      { name: "Vilnius", country: "Lithuania", latitude: 54.6872, longitude: 25.2797, population: 592389, timezone: "Europe/Vilnius" },
      { name: "Luxembourg", country: "Luxembourg", latitude: 49.6117, longitude: 6.1319, population: 128514, timezone: "Europe/Luxembourg" },
      { name: "Antananarivo", country: "Madagascar", latitude: -18.8792, longitude: 47.5079, population: 3058000, timezone: "Indian/Antananarivo" },
      { name: "Lilongwe", country: "Malawi", latitude: -13.9626, longitude: 33.7741, population: 1227100, timezone: "Africa/Blantyre" },
      { name: "Kuala Lumpur", country: "Malaysia", latitude: 3.1390, longitude: 101.6869, population: 1982112, timezone: "Asia/Kuala_Lumpur" },
      { name: "Malé", country: "Maldives", latitude: 4.1755, longitude: 73.5093, population: 252768, timezone: "Indian/Maldives" },
      { name: "Bamako", country: "Mali", latitude: 12.6392, longitude: -8.0029, population: 2929000, timezone: "Africa/Bamako" },
      { name: "Valletta", country: "Malta", latitude: 35.8989, longitude: 14.5146, population: 5827, timezone: "Europe/Malta" },
      { name: "Majuro", country: "Marshall Islands", latitude: 7.0897, longitude: 171.3803, population: 30000, timezone: "Pacific/Majuro" },
      { name: "Nouakchott", country: "Mauritania", latitude: 18.0735, longitude: -15.9582, population: 1315000, timezone: "Africa/Nouakchott" },
      { name: "Port Louis", country: "Mauritius", latitude: -20.1609, longitude: 57.5012, population: 147688, timezone: "Indian/Mauritius" },
      { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, population: 9209944, timezone: "America/Mexico_City" },
      { name: "Palikir", country: "Micronesia", latitude: 6.9248, longitude: 158.1611, population: 7000, timezone: "Pacific/Pohnpei" },
      { name: "Chișinău", country: "Moldova", latitude: 47.0105, longitude: 28.8638, population: 695400, timezone: "Europe/Chisinau" },
      { name: "Monaco", country: "Monaco", latitude: 43.7384, longitude: 7.4246, population: 38300, timezone: "Europe/Monaco" },
      { name: "Ulaanbaatar", country: "Mongolia", latitude: 47.8864, longitude: 106.9057, population: 1600000, timezone: "Asia/Ulaanbaatar" },
      { name: "Podgorica", country: "Montenegro", latitude: 42.4304, longitude: 19.2594, population: 187085, timezone: "Europe/Podgorica" },
      { name: "Rabat", country: "Morocco", latitude: 34.0209, longitude: -6.8416, population: 1932000, timezone: "Africa/Casablanca" },
      { name: "Maputo", country: "Mozambique", latitude: -25.9692, longitude: 32.5732, population: 1124988, timezone: "Africa/Maputo" },
      { name: "Naypyidaw", country: "Myanmar", latitude: 19.7633, longitude: 96.0785, population: 925000, timezone: "Asia/Yangon" },
      { name: "Windhoek", country: "Namibia", latitude: -22.5594, longitude: 17.0832, population: 446000, timezone: "Africa/Windhoek" },
      { name: "Yaren", country: "Nauru", latitude: -0.5477, longitude: 166.9209, population: 747, timezone: "Pacific/Nauru" },
      { name: "Kathmandu", country: "Nepal", latitude: 27.7172, longitude: 85.3240, population: 1442271, timezone: "Asia/Kathmandu" },
      { name: "Amsterdam", country: "Netherlands", latitude: 52.3676, longitude: 4.9041, population: 905234, timezone: "Europe/Amsterdam" },
      { name: "Wellington", country: "New Zealand", latitude: -41.2865, longitude: 174.7762, population: 217000, timezone: "Pacific/Auckland" },
      { name: "Managua", country: "Nicaragua", latitude: 12.1150, longitude: -86.2362, population: 1095000, timezone: "America/Managua" },
      { name: "Niamey", country: "Niger", latitude: 13.5127, longitude: 2.1126, population: 1336000, timezone: "Africa/Niamey" },
      { name: "Abuja", country: "Nigeria", latitude: 9.0765, longitude: 7.3986, population: 3464000, timezone: "Africa/Lagos" },
      { name: "Pyongyang", country: "North Korea", latitude: 39.0392, longitude: 125.7625, population: 3038000, timezone: "Asia/Pyongyang" },
      { name: "Skopje", country: "North Macedonia", latitude: 41.9973, longitude: 21.4280, population: 595879, timezone: "Europe/Skopje" },
      { name: "Oslo", country: "Norway", latitude: 59.9139, longitude: 10.7522, population: 709037, timezone: "Europe/Oslo" },
      { name: "Muscat", country: "Oman", latitude: 23.5859, longitude: 58.4059, population: 1560000, timezone: "Asia/Muscat" },
      { name: "Islamabad", country: "Pakistan", latitude: 33.6844, longitude: 73.0479, population: 1125000, timezone: "Asia/Karachi" },
      { name: "Ngerulmud", country: "Palau", latitude: 7.5150, longitude: 134.6243, population: 271, timezone: "Pacific/Palau" },
      { name: "East Jerusalem", country: "Palestine", latitude: 31.7834, longitude: 35.2339, population: 328601, timezone: "Asia/Hebron" },
      { name: "Panama City", country: "Panama", latitude: 8.9824, longitude: -79.5199, population: 1938000, timezone: "America/Panama" },
      { name: "Port Moresby", country: "Papua New Guinea", latitude: -9.4438, longitude: 147.1803, population: 410954, timezone: "Pacific/Port_Moresby" },
      { name: "Asunción", country: "Paraguay", latitude: -25.2637, longitude: -57.5759, population: 3452000, timezone: "America/Asuncion" },
      { name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428, population: 11045000, timezone: "America/Lima" },
      { name: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842, population: 13923452, timezone: "Asia/Manila" },
      { name: "Warsaw", country: "Poland", latitude: 52.2297, longitude: 21.0122, population: 1863056, timezone: "Europe/Warsaw" },
      { name: "Lisbon", country: "Portugal", latitude: 38.7223, longitude: -9.1393, population: 548703, timezone: "Europe/Lisbon" },
      { name: "Doha", country: "Qatar", latitude: 25.2854, longitude: 51.5310, population: 2382000, timezone: "Asia/Qatar" },
      { name: "Bucharest", country: "Romania", latitude: 44.4268, longitude: 26.1025, population: 1716961, timezone: "Europe/Bucharest" },
      { name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6173, population: 13010112, timezone: "Europe/Moscow" },
      { name: "Kigali", country: "Rwanda", latitude: -1.9441, longitude: 30.0619, population: 1257000, timezone: "Africa/Kigali" },
      { name: "Basseterre", country: "Saint Kitts and Nevis", latitude: 17.2955, longitude: -62.7250, population: 14000, timezone: "America/St_Kitts" },
      { name: "Castries", country: "Saint Lucia", latitude: 14.0101, longitude: -60.9875, population: 20000, timezone: "America/St_Lucia" },
      { name: "Kingstown", country: "Saint Vincent and the Grenadines", latitude: 13.1600, longitude: -61.2248, population: 25000, timezone: "America/St_Vincent" },
      { name: "Apia", country: "Samoa", latitude: -13.8314, longitude: -171.7518, population: 37708, timezone: "Pacific/Apia" },
      { name: "San Marino", country: "San Marino", latitude: 43.9333, longitude: 12.4467, population: 4467, timezone: "Europe/San_Marino" },
      { name: "São Tomé", country: "São Tomé and Príncipe", latitude: 0.3365, longitude: 6.7273, population: 95000, timezone: "Africa/Sao_Tome" },
      { name: "Riyadh", country: "Saudi Arabia", latitude: 24.7136, longitude: 46.6753, population: 7682000, timezone: "Asia/Riyadh" },
      { name: "Dakar", country: "Senegal", latitude: 14.7167, longitude: -17.4677, population: 3984500, timezone: "Africa/Dakar" },
      { name: "Belgrade", country: "Serbia", latitude: 44.7866, longitude: 20.4489, population: 1405192, timezone: "Europe/Belgrade" },
      { name: "Victoria", country: "Seychelles", latitude: -4.6191, longitude: 55.4513, population: 26450, timezone: "Indian/Mahe" },
      { name: "Freetown", country: "Sierra Leone", latitude: 8.4657, longitude: -13.2317, population: 1202000, timezone: "Africa/Freetown" },
      { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, population: 5453600, timezone: "Asia/Singapore" },
      { name: "Bratislava", country: "Slovakia", latitude: 48.1486, longitude: 17.1077, population: 437725, timezone: "Europe/Bratislava" },
      { name: "Ljubljana", country: "Slovenia", latitude: 46.0569, longitude: 14.5058, population: 295504, timezone: "Europe/Ljubljana" },
      { name: "Honiara", country: "Solomon Islands", latitude: -9.4456, longitude: 159.9729, population: 85000, timezone: "Pacific/Guadalcanal" },
      { name: "Mogadishu", country: "Somalia", latitude: 2.0469, longitude: 45.3182, population: 2610000, timezone: "Africa/Mogadishu" },
      { name: "Pretoria", country: "South Africa", latitude: -25.7479, longitude: 28.2293, population: 2472612, timezone: "Africa/Johannesburg" },
      { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780, population: 9508451, timezone: "Asia/Seoul" },
      { name: "Juba", country: "South Sudan", latitude: 4.8517, longitude: 31.5825, population: 525953, timezone: "Africa/Juba" },
      { name: "Madrid", country: "Spain", latitude: 40.4168, longitude: -3.7038, population: 3332035, timezone: "Europe/Madrid" },
      { name: "Colombo", country: "Sri Lanka", latitude: 6.9271, longitude: 79.8612, population: 648034, timezone: "Asia/Colombo" },
      { name: "Khartoum", country: "Sudan", latitude: 15.5007, longitude: 32.5599, population: 6344348, timezone: "Africa/Khartoum" },
      { name: "Paramaribo", country: "Suriname", latitude: 5.8520, longitude: -55.2038, population: 241000, timezone: "America/Paramaribo" },
      { name: "Stockholm", country: "Sweden", latitude: 59.3293, longitude: 18.0686, population: 982635, timezone: "Europe/Stockholm" },
      { name: "Bern", country: "Switzerland", latitude: 46.9479, longitude: 7.4474, population: 144744, timezone: "Europe/Zurich" },
      { name: "Damascus", country: "Syria", latitude: 33.5138, longitude: 36.2765, population: 2503000, timezone: "Asia/Damascus" },
      { name: "Taipei", country: "Taiwan", latitude: 25.0330, longitude: 121.5654, population: 2602418, timezone: "Asia/Taipei" },
      { name: "Dushanbe", country: "Tajikistan", latitude: 38.5358, longitude: 68.7791, population: 1034000, timezone: "Asia/Dushanbe" },
      { name: "Dodoma", country: "Tanzania", latitude: -6.1630, longitude: 35.7516, population: 765179, timezone: "Africa/Dar_es_Salaam" },
      { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, population: 11070000, timezone: "Asia/Bangkok" },
      { name: "Dili", country: "Timor-Leste", latitude: -8.5569, longitude: 125.5603, population: 318000, timezone: "Asia/Dili" },
      { name: "Lomé", country: "Togo", latitude: 6.1256, longitude: 1.2254, population: 2188000, timezone: "Africa/Lome" },
      { name: "Nuku'alofa", country: "Tonga", latitude: -21.1789, longitude: -175.1982, population: 35184, timezone: "Pacific/Tongatapu" },
      { name: "Port of Spain", country: "Trinidad and Tobago", latitude: 10.6596, longitude: -61.5086, population: 595000, timezone: "America/Port_of_Spain" },
      { name: "Tunis", country: "Tunisia", latitude: 36.8065, longitude: 10.1815, population: 2767000, timezone: "Africa/Tunis" },
      { name: "Ankara", country: "Turkey", latitude: 39.9334, longitude: 32.8597, population: 5747325, timezone: "Europe/Istanbul" },
      { name: "Ashgabat", country: "Turkmenistan", latitude: 37.9601, longitude: 58.3261, population: 1030000, timezone: "Asia/Ashgabat" },
      { name: "Funafuti", country: "Tuvalu", latitude: -8.5243, longitude: 179.1942, population: 7000, timezone: "Pacific/Funafuti" },
      { name: "Kampala", country: "Uganda", latitude: 0.3476, longitude: 32.5825, population: 3651000, timezone: "Africa/Kampala" },
      { name: "Kyiv", country: "Ukraine", latitude: 50.4501, longitude: 30.5234, population: 2952301, timezone: "Europe/Kiev" },
      { name: "Abu Dhabi", country: "United Arab Emirates", latitude: 24.4539, longitude: 54.3773, population: 1807000, timezone: "Asia/Dubai" },
      { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278, population: 9648110, timezone: "Europe/London" },
      { name: "Washington", country: "United States", latitude: 38.9072, longitude: -77.0369, population: 712816, timezone: "America/New_York" },
      { name: "Montevideo", country: "Uruguay", latitude: -34.9011, longitude: -56.1645, population: 1760000, timezone: "America/Montevideo" },
      { name: "Tashkent", country: "Uzbekistan", latitude: 41.2995, longitude: 69.2401, population: 2571000, timezone: "Asia/Tashkent" },
      { name: "Port Vila", country: "Vanuatu", latitude: -17.7333, longitude: 168.3273, population: 66000, timezone: "Pacific/Efate" },
      { name: "Vatican City", country: "Vatican City", latitude: 41.9029, longitude: 12.4534, population: 825, timezone: "Europe/Vatican" },
      { name: "Caracas", country: "Venezuela", latitude: 10.4806, longitude: -66.9036, population: 2938000, timezone: "America/Caracas" },
      { name: "Hanoi", country: "Vietnam", latitude: 21.0285, longitude: 105.8542, population: 8247600, timezone: "Asia/Ho_Chi_Minh" },
      { name: "Sana'a", country: "Yemen", latitude: 15.3694, longitude: 44.1910, population: 3292000, timezone: "Asia/Aden" },
      { name: "Lusaka", country: "Zambia", latitude: -15.3875, longitude: 28.3228, population: 2906000, timezone: "Africa/Lusaka" },
      { name: "Harare", country: "Zimbabwe", latitude: -17.8252, longitude: 31.0335, population: 2150000, timezone: "Africa/Harare" }
    ]
  }, null, 2),

  nestedData: JSON.stringify({
    root: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                message: "Deep nested structure",
                data: {
                  items: [
                    { id: 1, value: "First" },
                    { id: 2, value: "Second" },
                    { id: 3, value: "Third" },
                  ],
                  metadata: {
                    created: "2025-08-03T10:00:00Z",
                    updated: "2025-08-03T11:00:00Z",
                    version: "1.0.0",
                  },
                },
              },
            },
          },
        },
      },
      parallel: {
        branch1: {
          data: "Branch 1 data",
          children: [
            { name: "Child 1" },
            { name: "Child 2" },
          ],
        },
        branch2: {
          data: "Branch 2 data",
          children: [
            { name: "Child A" },
            { name: "Child B" },
          ],
        },
      },
    },
  }, null, 2),

  apiResponse: JSON.stringify({
    status: "success",
    code: 200,
    message: "Data retrieved successfully",
    timestamp: "2025-08-03T12:00:00.000Z",
    request: {
      method: "GET",
      endpoint: "/api/v1/data",
      params: {
        page: 1,
        limit: 50,
        sort: "created_at",
        order: "desc",
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "xxxxx-xxxxx-xxxxx",
        "X-Request-ID": "req_123456789",
      },
    },
    response: {
      data: [
        {
          id: "rec_001",
          type: "user",
          attributes: {
            name: "Alice Johnson",
            email: "alice@example.com",
            role: "admin",
            active: true,
          },
        },
        {
          id: "rec_002",
          type: "user",
          attributes: {
            name: "Bob Smith",
            email: "bob@example.com",
            role: "user",
            active: true,
          },
        },
      ],
      pagination: {
        page: 1,
        perPage: 50,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      links: {
        self: "/api/v1/data?page=1&limit=50",
        first: "/api/v1/data?page=1&limit=50",
        last: "/api/v1/data?page=1&limit=50",
        next: null,
        prev: null,
      },
    },
    metadata: {
      version: "1.0.0",
      documentation: "https://api.example.com/docs",
      rateLimit: {
        limit: 1000,
        remaining: 999,
        reset: "2025-08-03T13:00:00.000Z",
      },
    },
  }, null, 2),

  configuration: JSON.stringify({
    application: {
      name: "CorporateHub",
      version: "2.4.1",
      environment: "production",
      deploymentDate: "2025-07-15T14:30:00Z",
      buildNumber: "2025.07.15.1430",
      maintainer: "DevOps Team"
    },
    server: {
      host: "api.corporatehub.com",
      port: 443,
      protocol: "https",
      ssl: {
        enabled: true,
        certificateProvider: "LetsEncrypt",
        certificateExpiry: "2025-12-15T23:59:59Z",
        tlsVersion: "1.3",
        cipherSuites: [
          "TLS_AES_256_GCM_SHA384",
          "TLS_CHACHA20_POLY1305_SHA256",
          "TLS_AES_128_GCM_SHA256"
        ]
      },
      compression: {
        enabled: true,
        algorithm: "gzip",
        level: 6,
        minSize: 1024
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: 1000,
        burstSize: 50,
        windowSize: 60,
        skipSuccessfulRequests: false
      },
      cors: {
        enabled: true,
        allowedOrigins: [
          "https://app.corporatehub.com",
          "https://admin.corporatehub.com",
          "https://staging.corporatehub.com"
        ],
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-API-Key",
          "X-Request-ID",
          "X-Client-Version"
        ],
        allowCredentials: true,
        maxAge: 86400
      }
    },
    database: {
      primary: {
        type: "postgresql",
        host: "db-primary.corporatehub.internal",
        port: 5432,
        database: "corporatehub_prod",
        username: "${DB_USERNAME}",
        password: "${DB_PASSWORD}",
        ssl: true,
        connectionPool: {
          minConnections: 5,
          maxConnections: 50,
          acquireTimeoutMs: 30000,
          idleTimeoutMs: 600000,
          reapIntervalMs: 1000
        },
        queryTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      replica: {
        type: "postgresql",
        host: "db-replica.corporatehub.internal",
        port: 5432,
        database: "corporatehub_prod",
        username: "${DB_REPLICA_USERNAME}",
        password: "${DB_REPLICA_PASSWORD}",
        ssl: true,
        connectionPool: {
          minConnections: 3,
          maxConnections: 30,
          acquireTimeoutMs: 30000,
          idleTimeoutMs: 600000,
          reapIntervalMs: 1000
        },
        readOnly: true
      },
      redis: {
        host: "redis-cluster.corporatehub.internal",
        port: 6379,
        password: "${REDIS_PASSWORD}",
        database: 0,
        keyPrefix: "corporatehub:",
        connectionPool: {
          maxConnections: 20,
          minConnections: 2
        },
        cluster: {
          enabled: true,
          nodes: [
            "redis-1.corporatehub.internal:6379",
            "redis-2.corporatehub.internal:6379",
            "redis-3.corporatehub.internal:6379",
            "redis-4.corporatehub.internal:6379",
            "redis-5.corporatehub.internal:6379",
            "redis-6.corporatehub.internal:6379"
          ]
        },
        ttl: {
          session: 86400,
          cache: 3600,
          temp: 300
        }
      }
    },
    authentication: {
      jwt: {
        issuer: "corporatehub.com",
        audience: "corporatehub-api",
        algorithm: "RS256",
        accessTokenExpiry: 900,
        refreshTokenExpiry: 604800,
        secretRotationDays: 30,
        publicKeyUrl: "https://auth.corporatehub.com/.well-known/jwks.json"
      },
      oauth: {
        providers: [
          {
            name: "google",
            clientId: "${GOOGLE_CLIENT_ID}",
            clientSecret: "${GOOGLE_CLIENT_SECRET}",
            redirectUri: "https://api.corporatehub.com/auth/callback/google",
            scopes: ["openid", "email", "profile"],
            enabled: true
          },
          {
            name: "microsoft",
            clientId: "${MICROSOFT_CLIENT_ID}",
            clientSecret: "${MICROSOFT_CLIENT_SECRET}",
            redirectUri: "https://api.corporatehub.com/auth/callback/microsoft",
            scopes: ["openid", "email", "profile"],
            enabled: true
          },
          {
            name: "github",
            clientId: "${GITHUB_CLIENT_ID}",
            clientSecret: "${GITHUB_CLIENT_SECRET}",
            redirectUri: "https://api.corporatehub.com/auth/callback/github",
            scopes: ["user:email", "read:user"],
            enabled: false
          }
        ]
      },
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 7776000,
        preventReuse: 5,
        lockoutAttempts: 5,
        lockoutDuration: 1800
      },
      mfa: {
        enabled: true,
        required: false,
        providers: ["totp", "sms", "email"],
        defaultProvider: "totp",
        backupCodes: {
          enabled: true,
          count: 10,
          length: 8
        }
      }
    },
    logging: {
      level: "info",
      format: "json",
      destination: "stdout",
      includeStackTrace: true,
      maxFileSize: "100MB",
      maxFiles: 10,
      datePattern: "YYYY-MM-DD",
      fields: {
        timestamp: true,
        level: true,
        message: true,
        requestId: true,
        userId: true,
        method: true,
        url: true,
        statusCode: true,
        responseTime: true,
        userAgent: true,
        ip: true
      },
      filters: {
        excludePaths: ["/health", "/metrics", "/favicon.ico"],
        excludeHeaders: ["authorization", "cookie"],
        sensitiveFields: ["password", "token", "secret", "key"]
      },
      externalServices: {
        elasticsearch: {
          enabled: true,
          host: "logs.corporatehub.internal",
          port: 9200,
          index: "corporatehub-logs",
          username: "${ELASTIC_USERNAME}",
          password: "${ELASTIC_PASSWORD}"
        },
        datadog: {
          enabled: true,
          apiKey: "${DATADOG_API_KEY}",
          service: "corporatehub-api",
          environment: "production",
          version: "2.4.1"
        }
      }
    },
    monitoring: {
      healthCheck: {
        enabled: true,
        endpoint: "/health",
        interval: 30,
        timeout: 5000,
        checks: [
          {
            name: "database",
            type: "database",
            critical: true,
            timeout: 3000
          },
          {
            name: "redis",
            type: "redis",
            critical: true,
            timeout: 2000
          },
          {
            name: "external-api",
            type: "http",
            url: "https://external-api.example.com/health",
            critical: false,
            timeout: 5000
          }
        ]
      },
      metrics: {
        enabled: true,
        endpoint: "/metrics",
        format: "prometheus",
        includeDefaultMetrics: true,
        customMetrics: [
          "user_registrations_total",
          "active_sessions_gauge",
          "api_requests_duration_seconds",
          "failed_login_attempts_total",
          "email_notifications_sent_total"
        ]
      },
      alerts: {
        enabled: true,
        channels: [
          {
            name: "slack",
            webhookUrl: "${SLACK_WEBHOOK_URL}",
            channel: "#alerts-production",
            enabled: true
          },
          {
            name: "email",
            recipients: ["devops@corporatehub.com", "engineering@corporatehub.com"],
            enabled: true
          },
          {
            name: "pagerduty",
            integrationKey: "${PAGERDUTY_INTEGRATION_KEY}",
            enabled: true
          }
        ],
        rules: [
          {
            name: "high_error_rate",
            condition: "error_rate > 5%",
            severity: "critical",
            duration: 300
          },
          {
            name: "high_response_time",
            condition: "avg_response_time > 2000ms",
            severity: "warning",
            duration: 600
          },
          {
            name: "database_connection_failure",
            condition: "database_health == false",
            severity: "critical",
            duration: 60
          }
        ]
      }
    },
    security: {
      encryption: {
        algorithm: "AES-256-GCM",
        keyRotationDays: 90,
        saltRounds: 12
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:",
        hsts: "max-age=31536000; includeSubDomains; preload",
        xFrameOptions: "DENY",
        xContentTypeOptions: "nosniff",
        referrerPolicy: "strict-origin-when-cross-origin"
      },
      ipWhitelist: {
        enabled: false,
        adminEndpoints: ["192.168.1.0/24", "10.0.0.0/8", "172.16.0.0/12"]
      },
      apiKeys: {
        enabled: true,
        headerName: "X-API-Key",
        rateLimitPerKey: 10000,
        expirationDays: 365
      }
    },
    email: {
      provider: "sendgrid",
      apiKey: "${SENDGRID_API_KEY}",
      fromAddress: "noreply@corporatehub.com",
      fromName: "CorporateHub",
      replyToAddress: "support@corporatehub.com",
      templates: {
        welcome: "d-1234567890abcdef",
        passwordReset: "d-fedcba0987654321",
        emailVerification: "d-1122334455667788",
        invoiceReminder: "d-8877665544332211"
      },
      rateLimit: {
        dailyLimit: 10000,
        hourlyLimit: 1000
      },
      retryPolicy: {
        attempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    },
    storage: {
      provider: "aws-s3",
      bucket: "corporatehub-production",
      region: "us-east-1",
      accessKeyId: "${AWS_ACCESS_KEY_ID}",
      secretAccessKey: "${AWS_SECRET_ACCESS_KEY}",
      encryption: "AES256",
      versioning: true,
      lifecycle: {
        enabled: true,
        rules: [
          {
            name: "archive_old_files",
            status: "Enabled",
            transitions: [
              {
                days: 30,
                storageClass: "STANDARD_IA"
              },
              {
                days: 90,
                storageClass: "GLACIER"
              },
              {
                days: 365,
                storageClass: "DEEP_ARCHIVE"
              }
            ]
          }
        ]
      },
      cdn: {
        enabled: true,
        provider: "cloudflare",
        domain: "cdn.corporatehub.com",
        cacheTtl: 86400,
        compression: true,
        minify: {
          css: true,
          js: true,
          html: true
        }
      }
    },
    cache: {
      strategy: "redis",
      defaultTtl: 3600,
      keyPrefix: "cache:",
      compression: true,
      serialization: "json",
      layers: [
        {
          name: "memory",
          enabled: true,
          maxSize: "100MB",
          ttl: 300
        },
        {
          name: "redis",
          enabled: true,
          ttl: 3600
        }
      ],
      policies: {
        userProfiles: {
          ttl: 1800,
          tags: ["user", "profile"],
          invalidateOn: ["user.update", "user.delete"]
        },
        apiResponses: {
          ttl: 300,
          tags: ["api", "response"],
          varyBy: ["userId", "endpoint", "params"]
        },
        staticContent: {
          ttl: 86400,
          tags: ["static"],
          compression: true
        }
      }
    },
    featureFlags: {
      provider: "launchdarkly",
      sdkKey: "${LAUNCHDARKLY_SDK_KEY}",
      pollInterval: 30,
      streamEnabled: true,
      offlineMode: false,
      flags: {
        newUserInterface: {
          enabled: true,
          rolloutPercentage: 75,
          targetUsers: ["beta-testers", "premium-users"],
          environments: ["staging", "production"]
        },
        advancedAnalytics: {
          enabled: false,
          rolloutPercentage: 0,
          targetUsers: ["admin", "enterprise-users"],
          environments: ["staging"]
        },
        mobileApp: {
          enabled: true,
          rolloutPercentage: 100,
          targetUsers: ["all"],
          environments: ["production"]
        },
        betaFeatures: {
          enabled: true,
          rolloutPercentage: 25,
          targetUsers: ["beta-testers"],
          environments: ["staging", "production"]
        },
        maintenanceMode: {
          enabled: false,
          rolloutPercentage: 0,
          targetUsers: [],
          environments: ["production"]
        }
      }
    },
    integrations: {
      stripe: {
        enabled: true,
        publishableKey: "${STRIPE_PUBLISHABLE_KEY}",
        secretKey: "${STRIPE_SECRET_KEY}",
        webhookSecret: "${STRIPE_WEBHOOK_SECRET}",
        apiVersion: "2023-10-16",
        currency: "usd",
        timeout: 30000
      },
      salesforce: {
        enabled: true,
        instanceUrl: "https://corporatehub.my.salesforce.com",
        clientId: "${SALESFORCE_CLIENT_ID}",
        clientSecret: "${SALESFORCE_CLIENT_SECRET}",
        username: "${SALESFORCE_USERNAME}",
        password: "${SALESFORCE_PASSWORD}",
        securityToken: "${SALESFORCE_SECURITY_TOKEN}",
        apiVersion: "58.0",
        sandbox: false
      },
      slack: {
        enabled: true,
        botToken: "${SLACK_BOT_TOKEN}",
        clientId: "${SLACK_CLIENT_ID}",
        clientSecret: "${SLACK_CLIENT_SECRET}",
        signingSecret: "${SLACK_SIGNING_SECRET}",
        defaultChannel: "#general",
        notificationChannels: {
          alerts: "#alerts",
          deployments: "#deployments",
          sales: "#sales-notifications"
        }
      },
      hubspot: {
        enabled: true,
        apiKey: "${HUBSPOT_API_KEY}",
        portalId: "${HUBSPOT_PORTAL_ID}",
        apiVersion: "v3",
        timeout: 15000,
        rateLimitBuffer: 10
      },
      googleAnalytics: {
        enabled: true,
        trackingId: "${GA_TRACKING_ID}",
        propertyId: "${GA_PROPERTY_ID}",
        measurementId: "${GA_MEASUREMENT_ID}",
        cookieConsent: true,
        anonymizeIp: true
      }
    },
    backup: {
      enabled: true,
      schedule: "0 2 * * *",
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
        yearly: 3
      },
      destinations: [
        {
          type: "s3",
          bucket: "corporatehub-backups",
          region: "us-west-2",
          encryption: true,
          storageClass: "STANDARD_IA"
        },
        {
          type: "azure",
          containerName: "backups",
          storageAccount: "corporatehubbackups",
          encryption: true
        }
      ],
      databases: {
        postgresql: {
          enabled: true,
          compression: true,
          format: "custom",
          excludeTables: ["logs", "sessions", "temp_data"]
        },
        redis: {
          enabled: true,
          format: "rdb",
          compression: true
        }
      },
      files: {
        enabled: true,
        compression: true,
        excludePatterns: ["*.log", "*.tmp", "node_modules/", ".git/", "cache/"]
      }
    },
    performance: {
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024,
        mimeTypes: [
          "text/plain",
          "text/html",
          "text/css",
          "text/javascript",
          "application/json",
          "application/javascript",
          "application/xml"
        ]
      },
      caching: {
        staticAssets: {
          maxAge: 31536000,
          immutable: true
        },
        apiResponses: {
          maxAge: 300,
          staleWhileRevalidate: 60
        }
      },
      optimization: {
        minifyHtml: true,
        minifyCss: true,
        minifyJs: true,
        imageOptimization: true,
        lazyLoading: true,
        bundleSplitting: true
      }
    },
    localization: {
      defaultLocale: "en-US",
      supportedLocales: [
        "en-US",
        "en-GB",
        "es-ES",
        "fr-FR",
        "de-DE",
        "it-IT",
        "pt-BR",
        "ja-JP",
        "ko-KR",
        "zh-CN",
        "zh-TW"
      ],
      fallbackLocale: "en-US",
      autoDetect: true,
      cookieName: "locale",
      headerName: "Accept-Language",
      translationService: {
        provider: "google-translate",
        apiKey: "${GOOGLE_TRANSLATE_API_KEY}",
        cacheTranslations: true,
        cacheTtl: 604800
      }
    },
    deployment: {
      strategy: "blue-green",
      environment: "production",
      region: "us-east-1",
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
      loadBalancer: {
        type: "application",
        scheme: "internet-facing",
        healthCheck: {
          path: "/health",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 5
        }
      },
      autoScaling: {
        enabled: true,
        minInstances: 3,
        maxInstances: 20,
        targetCpuUtilization: 70,
        scaleUpCooldown: 300,
        scaleDownCooldown: 300
      },
      rollback: {
        enabled: true,
        automaticTriggers: [
          "health_check_failure",
          "error_rate_threshold",
          "response_time_threshold"
        ],
        thresholds: {
          errorRate: 10,
          responseTime: 5000,
          healthCheckFailures: 3
        }
      }
    }
  }, null, 2),
};