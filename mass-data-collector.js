#!/usr/bin/env node

// MASS DATA COLLECTOR - Uses legitimate public APIs and data sources
import axios from 'axios';
import db from './src/config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

class MassDataCollector {
  constructor() {
    this.stats = { found: 0, processed: 0, errors: 0, sources: 0 };
    this.services = [];
  }

  async collectQueenslandOpenData() {
    console.log('🏛️ COLLECTING Queensland Government Open Data...');
    
    try {
      // Get all datasets from QLD data portal
      const response = await axios.get('https://www.data.qld.gov.au/api/3/action/package_search', {
        params: {
          q: 'youth OR legal OR mental health OR crisis OR support OR community services',
          rows: 1000
        }
      });

      this.stats.sources++;
      
      if (response.data.success && response.data.result.results) {
        console.log(`  Found ${response.data.result.results.length} relevant datasets`);
        
        for (const dataset of response.data.result.results) {
          try {
            // For each dataset, try to get CSV/JSON resources
            for (const resource of dataset.resources || []) {
              if (resource.format === 'CSV' || resource.format === 'JSON') {
                console.log(`    Processing: ${dataset.title}`);
                
                const dataResponse = await axios.get(resource.url, {
                  timeout: 10000,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Youth Justice Service Finder)'
                  }
                });

                // Try to parse and extract service info
                let data = dataResponse.data;
                if (typeof data === 'string' && data.includes(',')) {
                  // CSV data - look for addresses, phone numbers, service names
                  const lines = data.split('\n').slice(1); // Skip header
                  for (const line of lines.slice(0, 100)) { // Limit per dataset
                    const parts = line.split(',');
                    if (parts.length > 3) {
                      const possibleName = parts[0]?.replace(/"/g, '').trim();
                      const possibleAddress = parts.find(p => p.includes('QLD') || p.includes('Brisbane') || p.includes('Street'))?.replace(/"/g, '').trim();
                      
                      if (possibleName && possibleAddress && possibleName.length > 5) {
                        this.services.push({
                          id: uuidv4(),
                          name: possibleName,
                          description: `Service from ${dataset.title}`,
                          categories: ['government_data'],
                          keywords: ['queensland', 'government'],
                          organization: {
                            name: dataset.organization?.title || 'Queensland Government',
                            type: 'government'
                          },
                          location: {
                            address: possibleAddress,
                            city: this.extractCity(possibleAddress),
                            state: 'QLD',
                            postcode: this.extractPostcode(possibleAddress),
                            region: this.extractRegion(possibleAddress),
                            coordinates: null
                          },
                          contact: {
                            phone: this.extractPhone(line),
                            email: this.extractEmail(line)
                          },
                          data_source: 'qld_open_data_live',
                          youth_specific: dataset.title.toLowerCase().includes('youth'),
                          status: 'active',
                          dataset_title: dataset.title,
                          dataset_url: resource.url
                        });
                        this.stats.found++;
                      }
                    }
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (error) {
            console.log(`      Error processing dataset: ${error.message.slice(0, 50)}...`);
            this.stats.errors++;
          }
        }
      }
    } catch (error) {
      console.log(`Error accessing QLD Open Data: ${error.message}`);
      this.stats.errors++;
    }
  }

  async collectACNCCharities() {
    console.log('🏢 COLLECTING ACNC Charity Data...');
    
    try {
      // Australian Charities and Not-for-profits Commission public data
      const response = await axios.get('https://data.acnc.gov.au/api/3/action/package_search', {
        params: {
          q: 'youth OR children OR legal aid OR crisis support',
          rows: 500
        }
      });

      this.stats.sources++;

      if (response.data.success && response.data.result.results) {
        console.log(`  Found ${response.data.result.results.length} charity datasets`);
        
        for (const dataset of response.data.result.results.slice(0, 50)) {
          for (const resource of dataset.resources || []) {
            if (resource.format === 'CSV') {
              try {
                console.log(`    Processing: ${dataset.title}`);
                
                const dataResponse = await axios.get(resource.url, { timeout: 10000 });
                const lines = dataResponse.data.split('\n').slice(1);
                
                for (const line of lines.slice(0, 50)) {
                  const parts = line.split(',');
                  if (parts.length > 5) {
                    const name = parts[1]?.replace(/"/g, '').trim();
                    const address = parts.find(p => p.includes('QLD'))?.replace(/"/g, '').trim();
                    
                    if (name && address && name.length > 10) {
                      this.services.push({
                        id: uuidv4(),
                        name: name,
                        description: `Registered charity providing community services`,
                        categories: ['charity', 'community_service'],
                        keywords: ['charity', 'community', 'support'],
                        organization: {
                          name: name,
                          type: 'charity'
                        },
                        location: {
                          address: address,
                          city: this.extractCity(address),
                          state: 'QLD',
                          postcode: this.extractPostcode(address),
                          region: this.extractRegion(address),
                          coordinates: null
                        },
                        contact: {
                          phone: null,
                          email: null
                        },
                        data_source: 'acnc_live',
                        youth_specific: name.toLowerCase().includes('youth') || name.toLowerCase().includes('children'),
                        status: 'active'
                      });
                      this.stats.found++;
                    }
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 1500));
              } catch (error) {
                this.stats.errors++;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`Error accessing ACNC data: ${error.message}`);
      this.stats.errors++;
    }
  }

  async collectMyCommunityServices() {
    console.log('🌐 COLLECTING My Community Directory...');
    
    try {
      // Search for Queensland youth services
      const searchTerms = ['youth services queensland', 'legal aid queensland', 'mental health youth queensland', 'crisis support queensland'];
      
      for (const term of searchTerms) {
        try {
          console.log(`    Searching: ${term}`);
          
          const response = await axios.get('https://api.mycommunitydirectory.com.au/search', {
            params: {
              q: term,
              state: 'QLD',
              limit: 100
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Youth Justice Service Finder)'
            }
          });

          this.stats.sources++;

          if (response.data && Array.isArray(response.data)) {
            for (const service of response.data) {
              this.services.push({
                id: uuidv4(),
                name: service.name || service.title,
                description: service.description || service.summary || '',
                categories: service.categories || ['community_service'],
                keywords: ['community', 'directory'],
                organization: {
                  name: service.organisation_name || service.provider || 'Community Organization',
                  type: 'community'
                },
                location: {
                  address: service.address || '',
                  city: service.suburb || service.city || '',
                  state: 'QLD',
                  postcode: service.postcode || '',
                  region: (service.suburb || service.city || '').toLowerCase().replace(' ', '_'),
                  coordinates: service.latitude && service.longitude ? {
                    lat: parseFloat(service.latitude),
                    lng: parseFloat(service.longitude)
                  } : null
                },
                contact: {
                  phone: service.phone,
                  email: service.email
                },
                data_source: 'my_community_live',
                youth_specific: term.includes('youth'),
                status: 'active'
              });
              this.stats.found++;
            }
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log(`      Error with search term: ${error.message.slice(0, 50)}...`);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.log(`Error accessing My Community: ${error.message}`);
      this.stats.errors++;
    }
  }

  extractCity(address) {
    const cities = ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Rockhampton', 'Mackay'];
    return cities.find(city => address.includes(city)) || 'Queensland';
  }

  extractPostcode(address) {
    const match = address.match(/\b\d{4}\b/);
    return match ? match[0] : '';
  }

  extractRegion(address) {
    const city = this.extractCity(address);
    return city.toLowerCase().replace(' ', '_');
  }

  extractPhone(text) {
    const phoneMatch = text.match(/(\+61\s?|\(0\d\)|0\d)[\s\d\-\(\)]{8,}/);
    return phoneMatch ? phoneMatch[0].replace(/"/g, '') : null;
  }

  extractEmail(text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0].replace(/"/g, '') : null;
  }

  async run() {
    console.log('🚀 MASS DATA COLLECTION - Getting MAXIMUM real data from legitimate sources\n');
    
    await this.collectQueenslandOpenData();
    await this.collectACNCCharities();
    await this.collectMyCommunityServices();
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    
    for (const service of this.services) {
      const key = `${service.name.toLowerCase()}-${service.location.address}`;
      if (!seen.has(key) && service.name.length > 5) {
        seen.add(key);
        unique.push(service);
        this.stats.processed++;
      }
    }
    
    console.log('\n📊 MASS COLLECTION RESULTS:');
    console.log(`  Data sources accessed: ${this.stats.sources}`);
    console.log(`  Total found: ${this.stats.found}`);
    console.log(`  Unique services: ${this.stats.processed}`);
    console.log(`  Errors: ${this.stats.errors}`);
    
    // Export to file
    fs.writeFileSync('mass-collection-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.stats,
      services: unique
    }, null, 2));
    
    console.log('\n💾 Results saved to mass-collection-results.json');
    console.log(`\n🎉 COLLECTED ${this.stats.processed} REAL SERVICES from legitimate data sources!`);
    
    // Show breakdown
    const bySource = {};
    unique.forEach(s => {
      bySource[s.data_source] = (bySource[s.data_source] || 0) + 1;
    });
    
    console.log('\n📋 BREAKDOWN BY SOURCE:');
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} services`);
    });
    
    return unique;
  }
}

const collector = new MassDataCollector();
collector.run().catch(console.error);