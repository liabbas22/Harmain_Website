import {
  FaPizzaSlice,
  FaHamburger,
  FaIceCream,
  FaCoffee,
  FaFish,
} from "react-icons/fa";
import { GiChickenOven, GiNoodles } from "react-icons/gi";
import { MdLocalDrink } from "react-icons/md";
import karahi1 from "../assets/karahi1.webp";
import karahi2 from "../assets/karahi2.webp";
import karahi3 from "../assets/karahi3.webp";
import Tika from "../assets/Tika.webp";
import { AssetsData } from "../assets/assets";

export const categories = [
  { id: 1, title: "Pizza", icon: FaPizzaSlice },
  { id: 2, title: "Burger", icon: FaHamburger },
  { id: 3, title: "Chicken", icon: GiChickenOven },
  { id: 4, title: "Noodles", icon: GiNoodles },
  { id: 5, title: "Drinks", icon: MdLocalDrink },
  { id: 6, title: "Ice Cream", icon: FaIceCream },
  { id: 7, title: "Sea Food", icon: FaFish },
  { id: 8, title: "Coffee", icon: FaCoffee },
  { id: 9, title: "Pizza 2", icon: FaPizzaSlice },
  { id: 10, title: "Burger 2", icon: FaHamburger },
  { id: 11, title: "Chicken 2", icon: GiChickenOven },
  { id: 12, title: "Noodles 2", icon: GiNoodles },
  { id: 13, title: "Drinks 2", icon: MdLocalDrink },
  { id: 14, title: "Noodles 2", icon: GiNoodles },
  { id: 15, title: "Drinks 2", icon: MdLocalDrink },
];

export const foodItems = [
  { id: 1, name: "Chicken Cheese Paratha" },
  { id: 2, name: "Zinger Burger" },
  { id: 3, name: "Chicken Biryani" },
  { id: 4, name: "Beef Burger" },
  { id: 5, name: "Pizza Margherita" },
  { id: 6, name: "Chicken Karahi" },
];

export const suggestions = [
  "Chicken Cheese Paratha",
  "Chicken Karahi",
  "Kunafa",
  "Zinger Burger",
  "Pizza",
];
export const PopularItemData = [
  {
    id: 1,
    title: "Shikari Karahi",
    description: "Special spicy chicken karahi cooked in desi style",
    image: karahi1,

    options: [
      {
        name: "Half",
        actualPrice: 600,
        discountPrice: 560,
      },
      {
        name: "Full",
        actualPrice: 900,
        discountPrice: 850,
      },
    ],
  },

  {
    id: 2,
    title: "Mutton Peshawari Karahi",
    description: "Traditional mutton karahi with rich spices",
    image: karahi2,

    options: [
      {
        name: "Half",
        actualPrice: 800,
        discountPrice: 750,
      },
      {
        name: "Full",
        actualPrice: 1200,
        discountPrice: 1100,
      },
    ],
  },

  {
    id: 3,
    title: "Daal Makhni Handi",
    description: "Creamy black lentils cooked in rich butter and cream",
    image: karahi3,

    options: [
      {
        name: "Regular",
        actualPrice: 400,
        discountPrice: 350,
      },
    ],
  },

  {
    id: 4,
    title: "Chicken Tikka",
    description: "Smoky grilled chicken tikka with spices",
    image: Tika,

    options: [
      {
        name: "Single",
        actualPrice: 600,
        discountPrice: 550,
      },
      {
        name: "Family",
        actualPrice: 1100,
        discountPrice: 1000,
      },
    ],
  },
];

export const categoriesData = [
  {
    id: 1,
    name: "Pizza",
    image: AssetsData.CategoryImage,

    items: [
      {
        id: 1,
        title: "Spicy Italian",
        description:
          "Pizza sauce, fajita, mushroom, jalapeno, capsicum, cheese",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Small",
            actualPrice: 790,
          },
          {
            name: "Medium",
            actualPrice: 1290,
            discountPrice: 1090,
          },
          {
            name: "Large",
            actualPrice: 1790,
            discountPrice: 1590,
          },
        ],
      },

      {
        id: 2,
        title: "Chicken Fajita",
        description: "Loaded chicken fajita pizza with olives and extra cheese",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Small",
            actualPrice: 890,
            discountPrice: 690,
          },
          {
            name: "Medium",
            actualPrice: 1390,
            discountPrice: 1190,
          },
          {
            name: "Large",
            actualPrice: 1890,
            discountPrice: 1690,
          },
        ],
      },

      {
        id: 3,
        title: "Creamy Tikka",
        description:
          "Creamy tikka chunks with mozzarella cheese and special sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Small",
            actualPrice: 850,
            discountPrice: 650,
          },
          {
            name: "Medium",
            actualPrice: 1350,
            discountPrice: 1150,
          },
          {
            name: "Large",
            actualPrice: 1850,
            discountPrice: 1650,
          },
        ],
      },

      {
        id: 4,
        title: "Veggie Lover",
        description:
          "Fresh vegetables, olives, jalapenos and mozzarella cheese",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Small",
            actualPrice: 720,
            discountPrice: 520,
          },
          {
            name: "Medium",
            actualPrice: 1190,
            discountPrice: 990,
          },
          {
            name: "Large",
            actualPrice: 1690,
            discountPrice: 1490,
          },
        ],
      },

      {
        id: 5,
        title: "Extreme Cheese",
        description: "Extra cheesy pizza loaded with cheese burst and herbs",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Small",
            actualPrice: 950,
            discountPrice: 750,
          },
          {
            name: "Medium",
            actualPrice: 1490,
            discountPrice: 1290,
          },
          {
            name: "Large",
            actualPrice: 1990,
            discountPrice: 1790,
          },
        ],
      },
    ],
  },

  {
    id: 2,
    name: "Karahi",
    image: AssetsData.CategoryImage,

    items: [
      {
        id: 1,
        title: "Shikari Karahi",
        description:
          "Boneless chicken karahi topped with green chilli and cream",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 1890,
            discountPrice: 1690,
          },
          {
            name: "Full",
            actualPrice: 3390,
            discountPrice: 3090,
          },
          {
            name: "Qtr",
            actualPrice: 1490,
            discountPrice: 1290,
          },
        ],
      },

      {
        id: 2,
        title: "Chicken White Karahi",
        description: "Creamy white karahi cooked in butter and special herbs",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 1790,
            discountPrice: 1590,
          },
          {
            name: "Full",
            actualPrice: 3190,
            discountPrice: 2990,
          },
          {
            name: "Qtr",
            actualPrice: 1390,
            discountPrice: 1190,
          },
        ],
      },

      {
        id: 3,
        title: "Mutton Karahi",
        description: "Traditional mutton karahi with desi spices and tomatoes",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 2890,
            discountPrice: 2590,
          },
          {
            name: "Full",
            actualPrice: 4890,
            discountPrice: 4590,
          },
        ],
      },

      {
        id: 4,
        title: "Green Karahi",
        description:
          "Special green masala karahi with coriander and green chilli",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 1690,
            discountPrice: 1490,
          },
          {
            name: "Full",
            actualPrice: 2990,
            discountPrice: 2790,
          },
        ],
      },

      {
        id: 5,
        title: "Achari Karahi",
        description:
          "Spicy achari flavored chicken karahi with desi achar spices",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 1990,
            discountPrice: 1790,
          },
          {
            name: "Full",
            actualPrice: 3490,
            discountPrice: 3290,
          },
        ],
      },
    ],
  },

  {
    id: 3,
    name: "Chinese",
    image: AssetsData.CategoryImage,

    items: [
      {
        id: 1,
        title: "Chicken Chilli Dry",
        description:
          "Chicken strips stir fried with chilli sauce and vegetables",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Standard",
            actualPrice: 1340,
            discountPrice: 804,
            tag: "Full Serving",
          },
          {
            name: "Value",
            actualPrice: 690,
            discountPrice: 414,
            tag: "Half Serving",
          },
        ],
      },

      {
        id: 2,
        title: "Chicken Manchurian",
        description: "Crispy chicken balls tossed in spicy manchurian sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Standard",
            actualPrice: 1490,
            discountPrice: 850,
            tag: "Full Serving",
          },
          {
            name: "Value",
            actualPrice: 790,
            discountPrice: 450,
            tag: "Half Serving",
          },
        ],
      },

      {
        id: 3,
        title: "Chicken Chowmein",
        description:
          "Chinese noodles tossed with vegetables and chicken strips",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Regular",
            actualPrice: 790,
            discountPrice: 590,
          },
          {
            name: "Large",
            actualPrice: 1190,
            discountPrice: 990,
          },
        ],
      },

      {
        id: 4,
        title: "Egg Fried Rice",
        description: "Fried rice cooked with egg, vegetables and soy sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 690,
            discountPrice: 490,
          },
          {
            name: "Family",
            actualPrice: 1290,
            discountPrice: 990,
          },
        ],
      },

      {
        id: 5,
        title: "Chicken Shashlik",
        description: "Chicken cubes with vegetables cooked in shashlik sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Standard",
            actualPrice: 1140,
            discountPrice: 940,
          },
          {
            name: "Large",
            actualPrice: 1690,
            discountPrice: 1490,
          },
        ],
      },
    ],
  },

  {
    id: 4,
    name: "Burgers",
    image: AssetsData.CategoryImage,

    items: [
      {
        id: 1,
        title: "Zinger Burger",
        description: "Crispy chicken fillet burger with mayo and lettuce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 650,
            discountPrice: 450,
          },
          {
            name: "Meal",
            actualPrice: 950,
            discountPrice: 750,
          },
        ],
      },

      {
        id: 2,
        title: "Beef Burger",
        description: "Juicy beef patty burger with cheese and special sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 790,
            discountPrice: 590,
          },
          {
            name: "Meal",
            actualPrice: 1090,
            discountPrice: 890,
          },
        ],
      },

      {
        id: 3,
        title: "Tower Burger",
        description: "Double crispy fillet burger with cheese slice",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 890,
            discountPrice: 690,
          },
          {
            name: "Meal",
            actualPrice: 1190,
            discountPrice: 990,
          },
        ],
      },

      {
        id: 4,
        title: "Chicken Patty Burger",
        description: "Soft bun filled with crispy chicken patty and sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 590,
            discountPrice: 390,
          },
          {
            name: "Meal",
            actualPrice: 890,
            discountPrice: 690,
          },
        ],
      },

      {
        id: 5,
        title: "Jalapeno Burger",
        description: "Spicy jalapeno burger with extra cheese and sauce",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single",
            actualPrice: 820,
            discountPrice: 620,
          },
          {
            name: "Meal",
            actualPrice: 1120,
            discountPrice: 920,
          },
        ],
      },
    ],
  },

  {
    id: 5,
    name: "BBQ",
    image: AssetsData.CategoryImage,

    items: [
      {
        id: 1,
        title: "Chicken Tikka",
        description: "Traditional chicken tikka with smoky charcoal flavor",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Single Piece",
            actualPrice: 390,
            discountPrice: 290,
          },
          {
            name: "Double Piece",
            actualPrice: 650,
            discountPrice: 550,
          },
        ],
      },

      {
        id: 2,
        title: "Malai Boti",
        description: "Creamy malai boti cubes marinated with white spices",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 990,
            discountPrice: 790,
          },
          {
            name: "Full",
            actualPrice: 1690,
            discountPrice: 1490,
          },
        ],
      },

      {
        id: 3,
        title: "Chicken Reshmi Kabab",
        description: "Soft reshmi kabab with creamy texture and herbs",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 890,
            discountPrice: 690,
          },
          {
            name: "Full",
            actualPrice: 1490,
            discountPrice: 1290,
          },
        ],
      },

      {
        id: 4,
        title: "Beef Seekh Kabab",
        description: "Juicy beef seekh kabab cooked over charcoal grill",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "4 Pieces",
            actualPrice: 790,
            discountPrice: 590,
          },
          {
            name: "8 Pieces",
            actualPrice: 1290,
            discountPrice: 1090,
          },
        ],
      },

      {
        id: 5,
        title: "Chicken Bihari Boti",
        description: "Spicy bihari boti marinated in traditional spices",
        image: AssetsData.ChickenCheeseOmellete,

        options: [
          {
            name: "Half",
            actualPrice: 1050,
            discountPrice: 850,
          },
          {
            name: "Full",
            actualPrice: 1790,
            discountPrice: 1590,
          },
        ],
      },
    ],
  },
];

export const areas = [
  { id: 11, name: "Bahadurabad" },
  { id: 12, name: "Gulshan" },
  { id: 13, name: "Clifton" },
  { id: 14, name: "Saddar" },
  { id: 15, name: "Defence" },
  { id: 1, name: "Bahadurabad" },
  { id: 2, name: "Gulshan" },
  { id: 3, name: "Clifton" },
  { id: 4, name: "Saddar" },
  { id: 5, name: "Defence" },
  { id: 11, name: "Bahadurabad" },
  { id: 12, name: "Gulshan" },
  { id: 13, name: "Clifton" },
  { id: 14, name: "Saddar" },
  { id: 15, name: "Defence" },
  { id: 1, name: "Bahadurabad" },
  { id: 2, name: "Gulshan" },
  { id: 3, name: "Clifton" },
  { id: 4, name: "Saddar" },
  { id: 5, name: "Defence" },
  { id: 11, name: "Bahadurabad" },
  { id: 12, name: "Gulshan" },
  { id: 13, name: "Clifton" },
  { id: 14, name: "Saddar" },
  { id: 15, name: "Defence" },
  { id: 1, name: "Bahadurabad" },
  { id: 2, name: "Gulshan" },
  { id: 3, name: "Clifton" },
  { id: 4, name: "Saddar" },
  { id: 5, name: "Defence" },
];

export const Branch = [
  { id: 1, name: "Bahadurabad" },
  { id: 2, name: "Gulshan" },
];
