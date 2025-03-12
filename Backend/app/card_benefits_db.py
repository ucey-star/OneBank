credit_cards_db = {
    "Chase": {
        "Chase Sapphire Preferred® Card": {
            "rewards_structure": {
                "points": {
                    "Travel (through Chase Travel℠)": 5.0,
                    "Dining": 3.0,
                    "Online grocery (excluding Target, Walmart, and wholesale clubs)": 3.0,
                    "Select streaming services": 3.0,
                    "Other travel purchases": 2.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                # Approx. 1.25 cents per point for travel through Chase Ultimate Rewards
                "points_to_cash": 0.0125
            },
            "additional_benefits": {},
            "seasonal_benefits": {
                "Lyft rides": {
                    "benefit": "5x points",
                    "timeframe": "Through March 2025"
                },
                "Select Peloton equipment and accessory purchases over $150": {
                    "benefit": "5x points",
                    "timeframe": "Through March 31, 2025"
                },
                "DoorDash DashPass subscription": {
                    "benefit": "Complimentary",
                    "timeframe": "Activate by December 31, 2027"
                }
            },
            "quarterly_categories": {}
        },
        "Chase Freedom Unlimited®": {
            "rewards_structure": {
                "cashback": {
                    "Travel (through Chase Travel℠)": 0.05,  # 5% = 0.05
                    "Dining": 0.03,
                    "Drugstore": 0.03,
                    "Everything else": 0.015
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Chase Freedom Flex℠": {
            "rewards_structure": {
                "cashback": {
                    "Quarterly bonus categories": 0.05,  # up to $1,500 per quarter
                    "Travel (through Chase Travel℠)": 0.05,
                    "Dining": 0.03,
                    "Drugstore": 0.03,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {
                "Q1 2025": {
                    "Timeframe": "January 1 – March 31, 2025",
                    "Categories": [
                        "Grocery stores",
                        "Fitness clubs",
                        "Hair, nails, and spa services",
                        "Norwegian Cruise Line"
                    ]
                },
                "Q2 2025": {
                    "Timeframe": "April 1 – June 30, 2025",
                    "Categories": "To be announced"
                },
                "Q3 2025": {
                    "Timeframe": "July 1 – September 30, 2025",
                    "Categories": "To be announced"
                },
                "Q4 2025": {
                    "Timeframe": "October 1 – December 31, 2025",
                    "Categories": "To be announced"
                }
            }
        },
        "Chase Sapphire Reserve®": {
            "rewards_structure": {
                "points": {
                    "Hotels and car rentals through Chase Travel℠ (after $300 travel credit)": 10.0,
                    "Air travel through Chase Travel℠ (after $300 travel credit)": 5.0,
                    "Other travel worldwide": 3.0,
                    "Dining": 3.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                # Approx. 1.5 cents per point when booking travel through the portal
                "points_to_cash": 0.015
            },
            "additional_benefits": {},
            "seasonal_benefits": {
                "Lyft rides": {
                    "benefit": "10x points",
                    "timeframe": "Through March 2025"
                },
                "DoorDash DashPass subscription": {
                    "benefit": "Complimentary",
                    "timeframe": "Activate by December 31, 2024"
                }
            },
            "quarterly_categories": {}
        },
        "Chase Ink Business Preferred®": {
            "rewards_structure": {
                "points": {
                    "Travel, shipping, internet, cable, phone, social media/search ads (up to $150,000/yr)": 3.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                # Often 1.25 cents per point in select portals
                "points_to_cash": 0.0125
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Chase Ink Business Cash®": {
            "rewards_structure": {
                "cashback": {
                    "Office supply, internet, cable, phone (up to $25k/yr)": 0.05,
                    "Gas stations, restaurants (up to $25k/yr)": 0.02,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Chase Ink Business Unlimited®": {
            "rewards_structure": {
                "cashback": {
                    "All purchases": 0.015
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Chase Amazon Prime Rewards Visa Signature®": {
            "rewards_structure": {
                "cashback": {
                    "Amazon & Whole Foods (Prime)": 0.05,
                    "Restaurants, gas stations, drugstores": 0.02,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "American Express": {
        "The Platinum Card® from American Express": {
            "rewards_structure": {
                "points": {
                    "Flights booked directly w/ airline or Amex Travel": 5.0,
                    "Prepaid hotels booked through Amex Travel": 5.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                # Membership Rewards points often ~1 cent each for many redemptions
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Up to $200 Airline Fee Credit per calendar year": "Applicable for incidental fees charged by the selected airline",
                "Up to $200 in Uber Cash annually": "For U.S. rides or Uber Eats",
                "Up to $100 in statement credits at Saks Fifth Avenue": "Enrollment required"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "American Express® Gold Card": {
            "rewards_structure": {
                "points": {
                    "Restaurants worldwide": 4.0,
                    "U.S. supermarkets (on up to $25k/yr)": 4.0,
                    "Flights booked directly w/ airlines or Amex Travel": 3.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Up to $120 Dining Credit annually": "$10 monthly credit at participating partners; enrollment required",
                "Up to $120 Uber Cash annually": "$10 monthly for U.S. Uber rides or Uber Eats"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Blue Cash Preferred® Card from American Express": {
            "rewards_structure": {
                "cashback": {
                    "U.S. supermarkets (up to $6k/yr)": 0.06,
                    "Select U.S. streaming": 0.06,
                    "U.S. gas stations": 0.03,
                    "Transit": 0.03,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Blue Cash Everyday® Card from American Express": {
            "rewards_structure": {
                "cashback": {
                    "U.S. supermarkets (up to $6k/yr)": 0.03,
                    "U.S. online retail purchases (up to $6k/yr)": 0.03,
                    "U.S. gas stations (up to $6k/yr)": 0.03,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Amex EveryDay® Credit Card": {
            "rewards_structure": {
                "points": {
                    "U.S. supermarkets (up to $6k/yr)": 2.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "20% Extra Points": "Earn 20% extra points when making 20+ purchases in a billing period"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Amex EveryDay Preferred® Credit Card": {
            "rewards_structure": {
                "points": {
                    "U.S. supermarkets (up to $6k/yr)": 3.0,
                    "U.S. gas stations": 2.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "50% Extra Points": "Earn 50% extra points when making 30+ purchases in a billing period"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Delta SkyMiles® Gold American Express Card": {
            "rewards_structure": {
                "miles": {
                    "Delta purchases": 2.0,
                    "Restaurants worldwide": 2.0,
                    "U.S. supermarkets": 2.0,
                    "All other purchases": 1.0
                }
            },
            "redemption": {
                # Typically ~1 cent per mile
                "miles_to_cash": 0.01
            },
            "additional_benefits": {
                "First Checked Bag Free": "On Delta flights for cardholder + up to 8 companions",
                "Priority Boarding": "Zone 1 boarding on Delta"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Hilton Honors American Express Card": {
            "rewards_structure": {
                "points": {
                    "Hilton properties": 7.0,
                    "Restaurants, supermarkets, gas stations in the U.S.": 5.0,
                    "All other purchases": 3.0
                }
            },
            "redemption": {
                # Hilton points often ~0.5 cent each
                "points_to_cash": 0.005
            },
            "additional_benefits": {
                "Complimentary Silver Status": "Opportunity to earn Gold Status after meeting spend requirements"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "Capital One": {
        "Capital One Venture Rewards Credit Card": {
            "rewards_structure": {
                "miles": {
                    "All other purchases": 2.0,
                    "Hotels, vacation rentals, and rental cars (through Capital One Travel)": 5.0
                }
            },
            "redemption": {
                "miles_to_cash": 0.01
            },
            "additional_benefits": {
                "Global Entry or TSA PreCheck® application fee credit": "Up to $100"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One Venture X Rewards Credit Card": {
            "rewards_structure": {
                "miles": {
                    "All purchases": 2.0,
                    "Hotels and rental cars (through Capital One Travel)": 10.0,
                    "Flights (through Capital One Travel)": 5.0
                }
            },
            "redemption": {
                "miles_to_cash": 0.01
            },
            "additional_benefits": {
                "Annual travel credit": "$300 for bookings through Capital One Travel",
                "Airport lounge access": "Unlimited access to Capital One Lounges and Priority Pass™ lounges",
                "Global Entry or TSA PreCheck® application fee credit": "Up to $100"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One Quicksilver Cash Rewards Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "All purchases": 0.015,
                    "Hotels and rental cars (through Capital One Travel)": 0.05
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One SavorOne Cash Rewards Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "Dining, entertainment, and popular streaming services": 0.03,
                    "Grocery stores (excluding superstores like Walmart® and Target®)": 0.03,
                    "Capital One Entertainment purchases": 0.08,
                    "Hotels and rental cars (through Capital One Travel)": 0.05,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One Savor Rewards Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "Dining, entertainment, and popular streaming services": 0.04,
                    "Grocery stores (excluding superstores)": 0.03,
                    "Capital One Entertainment purchases": 0.08,
                    "Hotels and rental cars (through Capital One Travel)": 0.05,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One Platinum Credit Card": {
            "rewards_structure": {},
            "redemption": {},
            "additional_benefits": {},
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Capital One Spark Cash Select for Business": {
            "rewards_structure": {
                "cashback": {
                    "All purchases": 0.015,
                    "Hotels and rental cars (through Capital One Travel)": 0.05
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Employee Rewards": "Set up individual cards and monitor spending"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "Discover": {
        "Discover it® Cash Back": {
            "rewards_structure": {
                "cashback": {
                    "Quarterly rotating categories (up to $1,500/quarter)": 0.05,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Cashback Match™": "Unlimited dollar-for-dollar match of all cash back earned the first year"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {
                "Q1 2025": {
                    "Timeframe": "January 1 – March 31, 2025",
                    "Categories": [
                        "Restaurants",
                        "Home improvement stores",
                        "Select streaming services"
                    ]
                },
                "Q2 2025": {
                    "Timeframe": "April 1 – June 30, 2025",
                    "Categories": "To be announced"
                },
                "Q3 2025": {
                    "Timeframe": "July 1 – September 30, 2025",
                    "Categories": "To be announced"
                },
                "Q4 2025": {
                    "Timeframe": "October 1 – December 31, 2025",
                    "Categories": "To be announced"
                }
            }
        },
        "Discover it® Student Cash Back": {
            "rewards_structure": {
                "cashback": {
                    "Quarterly rotating categories (up to $1,500/quarter)": 0.05,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Cashback Match™": "Unlimited dollar-for-dollar match of all cash back earned the first year",
                "Good Grade Reward": "$20 statement credit each school year (GPA 3.0+), for up to 5 years"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {
                "Q1 2025": {
                    "Timeframe": "January 1 – March 31, 2025",
                    "Categories": [
                        "Restaurants",
                        "Home improvement stores",
                        "Select streaming services"
                    ]
                },
                "Q2 2025": {
                    "Timeframe": "April 1 – June 30, 2025",
                    "Categories": "To be announced"
                },
                "Q3 2025": {
                    "Timeframe": "July 1 – September 30, 2025",
                    "Categories": "To be announced"
                },
                "Q4 2025": {
                    "Timeframe": "October 1 – December 31, 2025",
                    "Categories": "To be announced"
                }
            }
        },
        "Discover it® Miles": {
            "rewards_structure": {
                "miles": {
                    "All purchases": 1.5
                }
            },
            "redemption": {
                "miles_to_cash": 0.01
            },
            "additional_benefits": {
                "Miles Match™": "Unlimited mile-for-mile match at the end of first year"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Discover it® Chrome": {
            "rewards_structure": {
                "cashback": {
                    "Gas stations and restaurants (on up to $1,000 each quarter)": 0.02,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Cashback Match™": "Unlimited dollar-for-dollar match at the end of the first year"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Discover it® Secured Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "Gas stations and restaurants (on up to $1,000 each quarter)": 0.02,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Cashback Match™": "Unlimited dollar-for-dollar match at the end of the first year"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "Citi": {
        "Citi Double Cash® Card": {
            "rewards_structure": {
                "cashback": {
                    "All purchases": 0.02
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "No annual fee": True,
                "0% Intro APR on balance transfers": "0% for 18 months, then 18.49% – 28.49% variable"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Citi Premier® Card": {
            "rewards_structure": {
                "points": {
                    "Restaurants": 3.0,
                    "Supermarkets": 3.0,
                    "Gas stations": 3.0,
                    "Air travel and hotels": 3.0,
                    "Everything else": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Annual Hotel Savings Benefit": "$100 off a single $500+ hotel stay through thankyou.com once per year",
                "No foreign transaction fees": True,
                "Annual fee": "$95"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Citi Simplicity® Card": {
            "rewards_structure": {},
            "redemption": {},
            "additional_benefits": {
                "No late fees or penalty rates": True,
                "No annual fee": True,
                "0% Intro APR on balance transfers": "21 months on transfers, 12 months on purchases, then 18.49% – 29.24% variable"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Citi Custom Cash℠ Card": {
            "rewards_structure": {
                "cashback": {
                    "Top eligible spend category (up to $500 each billing cycle)": 0.05,
                    "All other purchases": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "No annual fee": True,
                "0% Intro APR on balance transfers and purchases": "15 months, then 18.49% – 28.49% variable"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Citi Rewards+® Card": {
            "rewards_structure": {
                "points": {
                    "Supermarkets and gas stations (up to $6,000/yr)": 2.0,
                    "All other purchases": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Points rounding": "Rounds each purchase up to the nearest 10 points",
                "10% Points Back": "For the first 100k points redeemed each year",
                "No annual fee": True,
                "0% Intro APR on balance transfers and purchases": "15 months, then 18.49% – 28.49% variable"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "Bank of America": {
        "Bank of America® Customized Cash Rewards Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "Choice category (gas, online shopping, dining, travel, drug stores, home improvement)": 0.03,
                    "Grocery stores and wholesale clubs (combined $2,500 quarterly cap)": 0.02,
                    "Everything else": 0.01
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "No annual fee": True,
                "0% Intro APR": "15 billing cycles on purchases and balance transfers"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Bank of America® Travel Rewards Credit Card": {
            "rewards_structure": {
                "points": {
                    "All purchases": 1.5
                }
            },
            "redemption": {
                # Typically 1 point = 1 cent when redeemed for travel statement credits
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "No annual fee": True,
                "No foreign transaction fees": True,
                "25,000 online bonus points": "After $1,000 in purchases in first 90 days"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "BankAmericard® Credit Card": {
            "rewards_structure": {},
            "redemption": {},
            "additional_benefits": {
                "No annual fee": True,
                "0% Intro APR": "21 billing cycles on purchases and balance transfers",
                "No penalty APR": True
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Alaska Airlines Visa® Credit Card": {
            "rewards_structure": {
                "miles": {
                    "Alaska Airlines purchases": 3.0,
                    "All other purchases": 1.0
                }
            },
            "redemption": {
                "miles_to_cash": 0.01
            },
            "additional_benefits": {
                "Annual Companion Fare": "From $122 each account anniversary",
                "Free checked bag": "For you and up to 6 guests on the same reservation",
                "20% back on in-flight purchases": True
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Bank of America® Premium Rewards® Credit Card": {
            "rewards_structure": {
                "points": {
                    "Travel and dining": 2.0,
                    "All other purchases": 1.5
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "No foreign transaction fees": True,
                "Up to $100 Airline Incidental Statement Credit": "Seat upgrades, baggage fees, in-flight services, etc.",
                "Up to $100 TSA PreCheck®/Global Entry Statement Credit": True
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    },
    "Wells Fargo": {
        "Wells Fargo Active Cash® Card": {
            "rewards_structure": {
                "cashback": {
                    "All purchases": 0.02
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0
            },
            "additional_benefits": {
                "Welcome Bonus": "$200 cash rewards bonus after $500 in purchases in the first 3 months",
                "Introductory APR": "0% for 12 months on purchases and balance transfers, then 19.49%, 24.49%, or 29.49% variable",
                "No annual fee": True,
                "Cell Phone Protection": "Up to $600 when you pay your monthly bill with the card"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Wells Fargo Reflect® Card": {
            "rewards_structure": {},
            "redemption": {},
            "additional_benefits": {
                "Introductory APR": "0% for 18 months (possible 3-month extension), then 17.49%, 24.49%, or 29.49% variable",
                "No annual fee": True,
                "No Penalty APR": True
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Wells Fargo Autograph℠ Card": {
            "rewards_structure": {
                "points": {
                    "Restaurants": 3.0,
                    "Travel": 3.0,
                    "Gas stations": 3.0,
                    "Transit": 3.0,
                    "Popular streaming services": 3.0,
                    "Phone plans": 3.0,
                    "All other purchases": 1.0
                }
            },
            "redemption": {
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Welcome Bonus": "20,000 bonus points after $1,000 in purchases in the first 3 months",
                "Introductory APR": "0% for 12 months, then 19.49%, 24.49%, or 29.49% variable",
                "No annual fee": True,
                "Cell Phone Protection": "Up to $600 when you pay your monthly bill with the card"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        },
        "Wells Fargo Business Platinum Credit Card": {
            "rewards_structure": {
                "cashback": {
                    "All purchases (Option 1)": 0.015
                },
                "points": {
                    "All purchases (Option 2)": 1.0
                }
            },
            "redemption": {
                "cashback_to_cash": 1.0,
                # If you choose the points option, you could treat 1 point = 1 cent
                "points_to_cash": 0.01
            },
            "additional_benefits": {
                "Intro APR": "0% for 9 months on purchases, then 11.24% to 21.24% variable",
                "No annual fee": True,
                "Employee Cards": "Add cards for employees with spending controls"
            },
            "seasonal_benefits": {},
            "quarterly_categories": {}
        }
    }
}