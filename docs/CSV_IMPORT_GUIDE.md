# CSV Import Guide for JusticeHub Services

## Quick Start

Add bulk services to JusticeHub using CSV files. Perfect for importing data from spreadsheets, databases, or partner organizations.

---

## CSV Format Specification

### Required Format

```csv
name,description,website,phone,email,category,location,state
"Youth Support Service Brisbane","Providing mental health and housing support for young people","https://example.org","07-1234-5678","contact@example.org","mental_health,housing","Brisbane","QLD"
```

### Field Definitions

| Field | Required | Format | Example | Notes |
|-------|----------|--------|---------|-------|
| `name` | ✅ Yes | String (max 200 chars) | "headspace Brisbane" | Organization or service name |
| `description` | ✅ Yes | String (max 1000 chars) | "Mental health support for youth 12-25" | Brief service description |
| `website` | ⚠️ Recommended | URL | "https://headspace.org.au" | Official website URL |
| `phone` | ⚠️ Recommended | Australian format | "07-1234-5678" or "1300 123 456" | Main contact number |
| `email` | ⚠️ Recommended | Email address | "contact@example.org" | Public contact email |
| `category` | ✅ Yes | Category IDs (comma-separated) | "mental_health,housing" | See categories below |
| `location` | ✅ Yes | City or region | "Brisbane" or "Queensland" | Primary service location |
| `state` | ✅ Yes | State code | "QLD", "NSW", "VIC", etc. | Australian state/territory |

### Optional Fields

| Field | Format | Example | Notes |
|-------|--------|---------|-------|
| `address` | Full address | "123 Main St, Brisbane QLD 4000" | Physical address |
| `postcode` | 4-digit code | "4000" | Australian postcode |
| `hours` | Text | "Mon-Fri 9am-5pm" | Operating hours |
| `cost` | Enum | "free", "low_cost", "fee_for_service" | Service cost |
| `eligibility` | Text | "Youth aged 12-25" | Who can access |
| `data_source` | Text | "Partner Organization Name" | Where data came from |
| `aboriginal_focus` | Boolean | "true" or "false" | Indigenous-specific service |
| `government_verified` | Boolean | "true" or "false" | Verified by government |

---

## Valid Categories

Use these category IDs in the `category` field (comma-separated for multiple):

### Legal & Justice
- `legal_aid` - Legal advice and representation
- `court_support` - Court navigation and support
- `advocacy` - Rights advocacy and representation
- `diversion` - Diversion programs

### Housing & Accommodation
- `housing` - Housing services and accommodation
- `emergency_accommodation` - Crisis housing

### Health & Wellbeing
- `mental_health` - Mental health support and counseling
- `substance_abuse` - Drug and alcohol services
- `health_services` - General health services

### Support Services
- `case_management` - Case management and coordination
- `family_support` - Family services and mediation
- `crisis_support` - Crisis intervention and helplines
- `support` - General support services

### Development & Education
- `education_training` - Education and job training
- `youth_development` - Youth development programs
- `recreation` - Recreation and activities

### Specialized Support
- `cultural_support` - Aboriginal and Torres Strait Islander services
- `gender_specific` - Gender-specific programs
- `multicultural_support` - Multicultural services
- `disability_support` - Disability services

---

## Example CSV Files

### Example 1: Basic Services
```csv
name,description,website,phone,email,category,location,state
"Headspace Brisbane","Youth mental health support ages 12-25","https://headspace.org.au/headspace-centres/brisbane","07-3902-7900","brisbane@headspace.org.au","mental_health","Brisbane","QLD"
"Legal Aid Queensland","Free legal advice for young people","https://www.legalaid.qld.gov.au","1300 651 188","laq@legalaid.qld.gov.au","legal_aid","Queensland","QLD"
"Youth Housing Project","Emergency housing for homeless youth","https://yhp.org.au","07-3257-7660","info@yhp.org.au","housing,emergency_accommodation","Brisbane","QLD"
```

### Example 2: With Optional Fields
```csv
name,description,website,phone,email,category,location,state,address,postcode,hours,cost,eligibility
"Youth Support Coordinator","School-based case management","https://education.qld.gov.au/ysc","07-3034-5000","ysc@qed.qld.gov.au","case_management,education_training","Brisbane","QLD","Education House, 30 Mary Street","4000","Mon-Fri 8:30am-4:30pm","free","High school students at risk"
```

### Example 3: Multiple Categories
```csv
name,description,website,phone,email,category,location,state
"Sisters Inside","Support for women and girls in justice system","https://sistersinside.com.au","07-3844-5066","admin@sistersinside.com.au","advocacy,gender_specific,legal_aid,housing","Brisbane","QLD"
```

---

## Import Process

### Option 1: Using Import Script (Recommended)

1. **Prepare your CSV file**
   ```bash
   # Save CSV to /data/imports/ directory
   # Example: /data/imports/my-services.csv
   ```

2. **Run the import script**
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/import-from-csv.ts /data/imports/my-services.csv
   ```

3. **Review import results**
   - Script shows progress for each service
   - Reports created/skipped/errors
   - Check console output for issues

### Option 2: Using Existing Airtable Import

If you have data in Airtable:

1. **Export from Airtable**
   - Open your Airtable base
   - Click "..." menu → "Download CSV"
   - Save as `Grid view.csv`

2. **Run Airtable import script**
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/import-from-airtable-csv.ts
   ```

---

## Data Validation

The import script automatically validates:

✅ **Required Fields**
- Name must not be empty
- Description must not be empty
- At least one category must be specified

✅ **Format Checks**
- Website URLs must be valid (http:// or https://)
- Email addresses must be valid format
- Phone numbers cleaned and standardized
- State codes validated against Australian states

✅ **Duplicate Detection**
- Checks for existing organizations by name
- Skips duplicate services
- Prevents data duplication

⚠️ **Warning Conditions**
- Missing website URL (service will be flagged for enrichment)
- Missing contact details (added to enrichment queue)
- Only generic 'support' category (marked for category improvement)

---

## Common Issues & Solutions

### Issue: "Organization already exists"
**Solution:** This is normal! The script links the service to the existing organization. No action needed.

### Issue: "Invalid category"
**Solution:** Check category IDs against the valid categories list above. Categories are case-sensitive and must match exactly.

### Issue: "Missing required field"
**Solution:** Ensure all required fields (name, description, category, location, state) are present in every row.

### Issue: "Invalid URL format"
**Solution:** URLs must start with `http://` or `https://`. Example: `https://example.org`

### Issue: Import script can't find file
**Solution:** Use absolute path or ensure file is in `/data/imports/` directory

---

## Best Practices

### Data Quality
1. **Be Specific:** Use detailed service descriptions (100-500 words ideal)
2. **Multiple Categories:** Tag services with 2-4 relevant categories
3. **Complete Contact Info:** Include website, phone, and email when possible
4. **Accurate Locations:** Use city names for specific services, state names for statewide

### Data Sources
1. **Document Sources:** Use `data_source` field to track where data came from
2. **Verify Accuracy:** Check organization websites before importing
3. **Update Regularly:** Re-import updated CSVs as services change

### Scaling
1. **Batch Imports:** Import 100-500 services at a time for best performance
2. **Test First:** Test with 5-10 services before bulk import
3. **Monitor Results:** Check import summary for errors

---

## After Import

### Automatic Enrichment
Imported services are automatically queued for enrichment:
- Missing contact details scraped from websites
- Categories improved using AI analysis
- Addresses geocoded for map display

### Manual Review
High-value services should be manually reviewed:
1. Check service details in admin dashboard
2. Verify contact information is current
3. Add additional context if available
4. Mark as `government_verified` if applicable

### Share with Organizations
After import, invite organizations to claim their listings:
1. Send email with claim link
2. Organizations verify ownership
3. They can update details directly
4. Listing marked as `verified: true`

---

## Sample Import Scripts

### Create CSV from JSON
```javascript
// /src/scripts/json-to-csv.ts
import { writeFileSync } from 'fs';

const services = [
  {
    name: "Example Service",
    description: "Description here",
    website: "https://example.org",
    phone: "07-1234-5678",
    email: "contact@example.org",
    category: "mental_health,housing",
    location: "Brisbane",
    state: "QLD"
  }
];

const csv = [
  'name,description,website,phone,email,category,location,state',
  ...services.map(s => `"${s.name}","${s.description}","${s.website}","${s.phone}","${s.email}","${s.category}","${s.location}","${s.state}"`)
].join('\n');

writeFileSync('/data/imports/services.csv', csv);
```

### Validate CSV Before Import
```bash
# Check CSV format
head -5 /data/imports/my-services.csv

# Count rows (excluding header)
wc -l /data/imports/my-services.csv

# Check for required fields
head -1 /data/imports/my-services.csv | grep -E "name.*description.*category.*location.*state"
```

---

## Next Steps

After importing services:

1. **Run Data Quality Report**
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/service-data-quality.ts
   ```

2. **Improve Categories (for services with only 'support')**
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/improve-service-categories.ts
   ```

3. **Enrich with Web Scraping**
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/enrich-imported-services.ts
   ```

4. **Review in Frontend**
   - Visit http://localhost:3000/services
   - Check services appear correctly
   - Test filtering and search

---

## Support

Questions or issues with CSV imports? Check:
- [Expansion Strategy](./EXPANSION_STRATEGY.md) for overall data collection approach
- [Database Schema](../supabase/SCHEMA.md) for field definitions
- Console output for specific error messages

---

**Pro Tip:** Start small! Import 10 services first to test your CSV format, then scale up to hundreds or thousands.
