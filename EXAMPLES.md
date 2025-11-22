# SAP OData Explorer - Natural Language Query Examples

This file contains examples of questions you can ask Claude to explore your SAP OData data. Simply ask in plain English!

---

## Table of Contents

1. [Basic Queries](#basic-queries)
2. [Price-Based Queries](#price-based-queries)
3. [Filtering and Searching](#filtering-and-searching)
4. [Sorting and Ranking](#sorting-and-ranking)
5. [Data Analysis](#data-analysis)
6. [Business Objects](#business-objects)
7. [Complex Questions](#complex-questions)

---

## Basic Queries

### Get Sample Data

**Ask Claude:**
- "Show me products from SAP"
- "Get 10 products from SAP"
- "What's in the products table?"
- "Display some sample data from SAP"

**What happens:** Claude retrieves a sample of products from your configured SAP service.

---

### Explore Available Data

**Ask Claude:**
- "What data is available in SAP?"
- "List the SAP OData services"
- "What entities can I query?"
- "Show me what's in the sepmra_shop service"

**What happens:** Claude explores your SAP system's available services and entities.

---

## Price-Based Queries

### Cheap Items

**Ask Claude:**
- "Show me products under $5"
- "What are the cheapest products?"
- "Find items under $10"
- "Get budget-friendly products from SAP"

**Example Result:**
```
Here are products under $5:
- Natural Rubber Eraser: $0.23
- Plastic Ruler (Red): $0.42
- Pencil Sharpener: $0.65
...
```

---

### Expensive Items

**Ask Claude:**
- "What are the most expensive products?"
- "Show me products over $100"
- "Find premium items in SAP"
- "Get the top 5 most expensive products"

**Example Result:**
```
Top 5 most expensive products:
1. Large Cabinet - $295.00
2. Leather Executive Chair (Brown) - $290.95
3. Leather Executive Chair (Red) - $279.00
...
```

---

### Price Range

**Ask Claude:**
- "Show me products between $20 and $50"
- "Find mid-range products"
- "What costs between $10 and $30?"

---

## Filtering and Searching

### By Category

**Ask Claude:**
- "Show me office furniture from SAP"
- "Find products in the Filing & Archiving category"
- "What writing supplies do we have?"
- "Get items from the Office Furniture category"

---

### By Supplier

**Ask Claude:**
- "Show me products from supplier OffiPOR"
- "What does bür-o-nline supply?"
- "List all suppliers and their products"

---

### By Name/Description

**Ask Claude:**
- "Find all chairs in SAP"
- "Show me products with 'lever arch' in the name"
- "Search for binder products"
- "Find anything related to office desks"

---

### By Stock Level

**Ask Claude:**
- "Show products with low inventory"
- "What items have less than 50 in stock?"
- "Find out-of-stock products"
- "Which products are running low?"

---

## Sorting and Ranking

### By Price

**Ask Claude:**
- "Sort products by price, cheapest first"
- "Show me products from most to least expensive"
- "Order items by cost"

---

### By Rating

**Ask Claude:**
- "What are the highest-rated products?"
- "Show me products with good reviews"
- "Find items with ratings above 4 stars"
- "What products do customers like best?"

---

### By Stock

**Ask Claude:**
- "Show products sorted by stock quantity"
- "What are the most stocked items?"
- "Order by availability"

---

## Data Analysis

### Inventory Management

**Ask Claude:**
- "Which products need reordering?"
- "Show me low-stock high-value items"
- "What expensive products have low inventory?"
- "Find products under 20 units in stock"

**Use Case:** Identify critical inventory items that need attention.

---

### Popular Items

**Ask Claude:**
- "What are the most reviewed products?"
- "Show me popular items under $10"
- "Find highly-rated budget products"
- "What products have the most customer feedback?"

**Use Case:** Identify best-value products for promotions.

---

### Supplier Analysis

**Ask Claude:**
- "Show me all products from supplier XYZ"
- "Which supplier has the most products?"
- "Compare products across suppliers"
- "What's the average price for each supplier?"

**Use Case:** Supplier performance and comparison analysis.

---

### Category Insights

**Ask Claude:**
- "What's the price range for office chairs?"
- "Show me the most expensive items in Filing category"
- "Compare prices across categories"
- "What categories have the most products?"

**Use Case:** Category-level business intelligence.

---

## Business Objects

### Products

**Ask Claude:**
- "Show me all products"
- "Get product details for ID AR-FB-1000"
- "What products are available?"
- "List product catalog"

---

### Business Partners

**Ask Claude:**
- "Get business partners from SAP"
- "Show me customer list"
- "What partners are in the system?"
- "List all vendors"

---

### Sales Orders

**Ask Claude:**
- "Show me recent sales orders"
- "Get orders for customer 100001"
- "What orders were placed this month?"
- "Find orders with status 'pending'"

---

## Complex Questions

### Multi-Criteria Filtering

**Ask Claude:**
- "Show me office chairs under $200 with high ratings"
- "Find products under $10 that are in stock"
- "Get filing products between $5 and $15 from supplier OffiPOR"
- "What cheap items have good reviews?"

---

### Comparative Analysis

**Ask Claude:**
- "Compare prices of leather chairs vs fabric chairs"
- "Show price difference between suppliers for similar products"
- "What's the average price per category?"

---

### Trend Analysis

**Ask Claude:**
- "Which products are frequently out of stock?"
- "What categories have the highest average prices?"
- "Show me the price distribution of products"

---

## Natural Language Tips

### Be Specific

✅ Good: "Show me the 10 cheapest office chairs from SAP"
❌ Vague: "Get stuff"

### Use Context

✅ Good: "Find products in the Filing category under $10"
❌ Unclear: "Find things"

### Ask Follow-ups

After getting results, you can ask:
- "Tell me more about the first one"
- "Show me similar products"
- "What else is in that category?"
- "Compare these with products from supplier XYZ"

---

## How Claude Interprets Your Questions

When you ask Claude about SAP data, it:

1. **Identifies the intent** - Are you searching, filtering, sorting, or analyzing?
2. **Extracts parameters** - Price ranges, categories, limits, etc.
3. **Builds the query** - Constructs proper OData query parameters
4. **Executes via skill** - Runs the query against your SAP system
5. **Interprets results** - Explains the data in natural language
6. **Saves data** - Stores raw JSON in output directory for reference

---

## Common Question Patterns

### "Show me..."
- Shows/lists data matching criteria
- Example: "Show me products under $20"

### "What is/are..."
- Retrieves specific information
- Example: "What are the most expensive items?"

### "Find..."
- Searches for matching records
- Example: "Find all chairs"

### "Get..."
- Retrieves data
- Example: "Get business partners"

### "Which..."
- Identifies specific items matching criteria
- Example: "Which products have low stock?"

### "Compare..."
- Analyzes differences
- Example: "Compare prices across suppliers"

---

## Data Output

All query results are automatically saved to the `output/` directory in JSON format for later analysis.

**Files created:**
- `output/products.json` - Query results
- `output/errors.log` - Any errors encountered
- `output/[custom-name].json` - If you specify a filename

---

## Next Steps

### Start Simple
Begin with basic questions:
- "Show me some products from SAP"
- "What data is available?"

### Get Specific
Once comfortable, add filters:
- "Show me office chairs under $150"
- "Find highly-rated products"

### Analyze
Ask analytical questions:
- "What are the most popular items?"
- "Which categories have the best value?"

### Explore
Discover your data:
- "What's interesting in the data?"
- "Show me outliers"
- "Any surprising patterns?"

---

## Technical Note

For developers: This skill uses OData V2/V4 protocols to query SAP Gateway services. Claude translates natural language into proper `$filter`, `$orderby`, `$select`, and `$top` parameters automatically.

For implementation details, see [SKILL.md](SKILL.md).

---

**Ready to explore? Just ask Claude about your SAP data!**
