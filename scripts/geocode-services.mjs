#!/usr/bin/env node
/**
 * Geocode Services
 *
 * This script adds latitude/longitude coordinates to services
 * based on their location_city and location_state information.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Comprehensive Australian city and region coordinates
const LOCATION_COORDINATES = {
  // === QUEENSLAND ===
  'brisbane': { lat: -27.4705, lng: 153.0260 },
  'gold coast': { lat: -28.0167, lng: 153.4000 },
  'sunshine coast': { lat: -26.6500, lng: 153.0667 },
  'townsville': { lat: -19.2590, lng: 146.8169 },
  'cairns': { lat: -16.9186, lng: 145.7781 },
  'toowoomba': { lat: -27.5598, lng: 151.9507 },
  'rockhampton': { lat: -23.3781, lng: 150.5136 },
  'mackay': { lat: -21.1450, lng: 149.1669 },
  'bundaberg': { lat: -24.8661, lng: 152.3489 },
  'hervey bay': { lat: -25.2897, lng: 152.8715 },
  'gladstone': { lat: -23.8478, lng: 151.2569 },
  'ipswich': { lat: -27.6144, lng: 152.7599 },
  'logan': { lat: -27.6397, lng: 153.1092 },
  'mount isa': { lat: -20.7256, lng: 139.4927 },
  'charters towers': { lat: -20.0772, lng: 146.2620 },
  'beenleigh': { lat: -27.7165, lng: 153.2029 },
  'south brisbane': { lat: -27.4803, lng: 153.0210 },
  'woodridge': { lat: -27.6310, lng: 153.1104 },
  'inala': { lat: -27.5853, lng: 152.9736 },
  'beaudesert': { lat: -27.9889, lng: 152.9956 },
  'palm island': { lat: -18.7333, lng: 146.5833 },
  'mornington island': { lat: -16.6667, lng: 139.5000 },
  'pormpuraaw': { lat: -14.8961, lng: 141.6056 },
  'aurukun': { lat: -13.3533, lng: 141.7283 },
  'weipa': { lat: -12.6269, lng: 141.8763 },
  'normanton': { lat: -17.6710, lng: 141.0744 },
  'doomadgee': { lat: -17.9333, lng: 138.8333 },
  'woorabinda': { lat: -24.1333, lng: 149.4500 },
  'cherbourg': { lat: -26.2842, lng: 151.9492 },
  'st lucia': { lat: -27.4988, lng: 153.0124 },
  'cleveland': { lat: -27.5278, lng: 153.2594 },
  'redcliffe': { lat: -27.2281, lng: 153.1028 },
  'springwood': { lat: -27.6167, lng: 153.1333 },
  'caboolture': { lat: -27.0667, lng: 152.9500 },
  'nambour': { lat: -26.6292, lng: 152.9533 },
  'gympie': { lat: -26.1897, lng: 152.6656 },
  'kingaroy': { lat: -26.5392, lng: 151.8406 },
  'roma': { lat: -26.5667, lng: 148.7833 },
  'emerald': { lat: -23.5275, lng: 148.1644 },
  'longreach': { lat: -23.4419, lng: 144.2497 },
  'winton': { lat: -22.3942, lng: 143.0361 },
  'cloncurry': { lat: -20.7058, lng: 140.5083 },
  'biloela': { lat: -24.4139, lng: 150.5153 },
  'yeppoon': { lat: -23.1333, lng: 150.7333 },
  'bowen': { lat: -20.0167, lng: 148.2333 },
  'ayr': { lat: -19.5697, lng: 147.4036 },
  'ingham': { lat: -18.6500, lng: 146.1667 },
  'innisfail': { lat: -17.5244, lng: 146.0297 },
  'mareeba': { lat: -17.0000, lng: 145.4333 },
  'atherton': { lat: -17.2667, lng: 145.4833 },
  'cooktown': { lat: -15.4736, lng: 145.2492 },
  'thursday island': { lat: -10.5833, lng: 142.2167 },
  'mount gravatt': { lat: -27.5333, lng: 153.0833 },
  'fortitude valley': { lat: -27.4561, lng: 153.0358 },
  'west end': { lat: -27.4833, lng: 153.0000 },
  'woolloongabba': { lat: -27.4939, lng: 153.0333 },
  'kangaroo point': { lat: -27.4778, lng: 153.0333 },
  'herston': { lat: -27.4500, lng: 153.0167 },
  'kelvin grove': { lat: -27.4500, lng: 153.0000 },
  'paddington': { lat: -27.4667, lng: 152.9833 },
  'red hill': { lat: -27.4667, lng: 152.9667 },
  'ashgrove': { lat: -27.4500, lng: 152.9667 },
  'milton': { lat: -27.4667, lng: 153.0000 },
  'toowong': { lat: -27.4833, lng: 152.9833 },
  'indooroopilly': { lat: -27.5000, lng: 152.9667 },
  'taringa': { lat: -27.4833, lng: 152.9833 },
  'chapel hill': { lat: -27.5000, lng: 152.9500 },
  'kenmore': { lat: -27.5167, lng: 152.9333 },

  // === NEW SOUTH WALES ===
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'newcastle': { lat: -32.9283, lng: 151.7817 },
  'wollongong': { lat: -34.4278, lng: 150.8931 },
  'dubbo': { lat: -32.2571, lng: 148.6058 },
  'wagga wagga': { lat: -35.1082, lng: 147.3598 },
  'bourke': { lat: -30.0914, lng: 145.9370 },
  'moree': { lat: -29.4639, lng: 149.8386 },
  'cowra': { lat: -33.8269, lng: 148.6875 },
  'nowra': { lat: -34.8817, lng: 150.6005 },
  'mount druitt': { lat: -33.7684, lng: 150.8205 },
  'parramatta': { lat: -33.8151, lng: 151.0011 },
  'penrith': { lat: -33.7507, lng: 150.6871 },
  'lismore': { lat: -28.8134, lng: 153.2769 },
  'tamworth': { lat: -31.0833, lng: 150.9167 },
  'orange': { lat: -33.2833, lng: 149.1000 },
  'albury': { lat: -36.0808, lng: 146.9158 },
  'coffs harbour': { lat: -30.2963, lng: 153.1135 },
  'bathurst': { lat: -33.4200, lng: 149.5778 },
  'port macquarie': { lat: -31.4308, lng: 152.9089 },
  'grafton': { lat: -29.6767, lng: 152.9370 },
  'armidale': { lat: -30.5150, lng: 151.6672 },
  'broken hill': { lat: -31.9505, lng: 141.4502 },
  'walgett': { lat: -30.0239, lng: 148.1181 },
  'wilcannia': { lat: -31.5569, lng: 143.3792 },
  'brewarrina': { lat: -29.9569, lng: 146.8536 },
  'kempsey': { lat: -31.0833, lng: 152.8333 },
  'central coast': { lat: -33.4250, lng: 151.3422 },
  'gosford': { lat: -33.4250, lng: 151.3422 },
  'maitland': { lat: -32.7333, lng: 151.5500 },
  'cessnock': { lat: -32.8333, lng: 151.3500 },
  'lake macquarie': { lat: -33.0833, lng: 151.5000 },
  'shellharbour': { lat: -34.5833, lng: 150.8667 },
  'kiama': { lat: -34.6750, lng: 150.8500 },
  'bega': { lat: -36.6739, lng: 149.8431 },
  'narooma': { lat: -36.2167, lng: 150.0667 },
  'batemans bay': { lat: -35.7083, lng: 150.1833 },
  'ulladulla': { lat: -35.3500, lng: 150.4667 },
  'young': { lat: -34.3167, lng: 148.3000 },
  'griffith': { lat: -34.2889, lng: 146.0531 },
  'leeton': { lat: -34.5500, lng: 146.4000 },
  'narrandera': { lat: -34.7500, lng: 146.5500 },
  'goulburn': { lat: -34.7500, lng: 149.7167 },
  'queanbeyan': { lat: -35.3500, lng: 149.2333 },
  'cooma': { lat: -36.2333, lng: 149.1333 },
  'forbes': { lat: -33.3833, lng: 148.0167 },
  'parkes': { lat: -33.1333, lng: 148.1833 },
  'mudgee': { lat: -32.5833, lng: 149.5833 },
  'lithgow': { lat: -33.4833, lng: 150.1500 },
  'inverell': { lat: -29.7667, lng: 151.1167 },
  'glen innes': { lat: -29.7333, lng: 151.7333 },
  'tenterfield': { lat: -29.0500, lng: 152.0167 },
  'casino': { lat: -28.8667, lng: 153.0500 },
  'ballina': { lat: -28.8667, lng: 153.5667 },
  'byron bay': { lat: -28.6500, lng: 153.6167 },
  'tweed heads': { lat: -28.1833, lng: 153.5500 },
  'murwillumbah': { lat: -28.3333, lng: 153.4000 },
  'blacktown': { lat: -33.7667, lng: 150.9167 },
  'liverpool': { lat: -33.9167, lng: 150.9167 },
  'campbelltown': { lat: -34.0667, lng: 150.8167 },
  'fairfield': { lat: -33.8667, lng: 150.9500 },
  'bankstown': { lat: -33.9167, lng: 151.0333 },
  'canterbury': { lat: -33.9167, lng: 151.1167 },
  'hurstville': { lat: -33.9667, lng: 151.1000 },
  'sutherland': { lat: -34.0333, lng: 151.0500 },
  'randwick': { lat: -33.9167, lng: 151.2333 },
  'bondi': { lat: -33.8917, lng: 151.2744 },
  'marrickville': { lat: -33.9083, lng: 151.1544 },
  'leichhardt': { lat: -33.8833, lng: 151.1500 },
  'strathfield': { lat: -33.8833, lng: 151.0833 },
  'burwood': { lat: -33.8833, lng: 151.1000 },
  'auburn': { lat: -33.8500, lng: 151.0333 },
  'ryde': { lat: -33.8167, lng: 151.1000 },
  'chatswood': { lat: -33.8000, lng: 151.1833 },
  'hornsby': { lat: -33.7000, lng: 151.1000 },
  'dee why': { lat: -33.7500, lng: 151.2833 },
  'manly': { lat: -33.8000, lng: 151.2833 },
  'mosman': { lat: -33.8333, lng: 151.2333 },
  'north sydney': { lat: -33.8333, lng: 151.2000 },
  'redfern': { lat: -33.8928, lng: 151.2044 },
  'surry hills': { lat: -33.8833, lng: 151.2167 },
  'waterloo': { lat: -33.9000, lng: 151.2000 },
  'zetland': { lat: -33.9083, lng: 151.2083 },
  'alexandria': { lat: -33.9083, lng: 151.1917 },
  'mascot': { lat: -33.9333, lng: 151.1833 },
  'botany': { lat: -33.9500, lng: 151.2000 },
  'maroubra': { lat: -33.9500, lng: 151.2333 },
  'coogee': { lat: -33.9167, lng: 151.2583 },
  'cabramatta': { lat: -33.8947, lng: 150.9353 },
  'granville': { lat: -33.8333, lng: 151.0000 },
  'merrylands': { lat: -33.8333, lng: 150.9833 },
  'wentworthville': { lat: -33.8000, lng: 150.9667 },
  'toongabbie': { lat: -33.7833, lng: 150.9500 },
  'seven hills': { lat: -33.7750, lng: 150.9333 },
  'rooty hill': { lat: -33.7667, lng: 150.8500 },
  'st marys': { lat: -33.7667, lng: 150.7833 },
  'kingswood': { lat: -33.7667, lng: 150.7333 },
  'emu plains': { lat: -33.7500, lng: 150.6667 },
  'richmond': { lat: -33.6000, lng: 150.7500 },
  'windsor': { lat: -33.6167, lng: 150.8167 },

  // === VICTORIA ===
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'geelong': { lat: -38.1499, lng: 144.3617 },
  'ballarat': { lat: -37.5622, lng: 143.8503 },
  'bendigo': { lat: -36.7570, lng: 144.2794 },
  'shepparton': { lat: -36.3806, lng: 145.3986 },
  'melton': { lat: -37.6833, lng: 144.5833 },
  'frankston': { lat: -38.1443, lng: 145.1265 },
  'mildura': { lat: -34.2075, lng: 142.1394 },
  'wodonga': { lat: -36.1217, lng: 146.8879 },
  'warrnambool': { lat: -38.3819, lng: 142.4824 },
  'horsham': { lat: -36.7108, lng: 142.2010 },
  'echuca': { lat: -36.1389, lng: 144.7517 },
  'bairnsdale': { lat: -37.8228, lng: 147.6108 },
  'traralgon': { lat: -38.1953, lng: 146.5411 },
  'dandenong': { lat: -37.9872, lng: 145.2144 },
  'sunshine': { lat: -37.7825, lng: 144.8325 },
  'werribee': { lat: -37.9000, lng: 144.6667 },
  'sunbury': { lat: -37.5833, lng: 144.7167 },
  'craigieburn': { lat: -37.6000, lng: 144.9500 },
  'epping': { lat: -37.6500, lng: 145.0333 },
  'mill park': { lat: -37.6667, lng: 145.0667 },
  'bundoora': { lat: -37.7000, lng: 145.0667 },
  'heidelberg': { lat: -37.7500, lng: 145.0667 },
  'box hill': { lat: -37.8167, lng: 145.1167 },
  'ringwood': { lat: -37.8167, lng: 145.2333 },
  'croydon': { lat: -37.8000, lng: 145.2833 },
  'lilydale': { lat: -37.7500, lng: 145.3500 },
  'pakenham': { lat: -38.0667, lng: 145.4833 },
  'berwick': { lat: -38.0333, lng: 145.3500 },
  'cranbourne': { lat: -38.1000, lng: 145.2833 },
  'mornington': { lat: -38.2167, lng: 145.0333 },
  'rosebud': { lat: -38.3500, lng: 144.9000 },
  'dromana': { lat: -38.3333, lng: 144.9667 },
  'st kilda': { lat: -37.8667, lng: 144.9833 },
  'brighton': { lat: -37.9167, lng: 145.0000 },
  'elsternwick': { lat: -37.8833, lng: 145.0000 },
  'caulfield': { lat: -37.8833, lng: 145.0333 },
  'oakleigh': { lat: -37.9000, lng: 145.0833 },
  'clayton': { lat: -37.9167, lng: 145.1167 },
  'springvale': { lat: -37.9500, lng: 145.1500 },
  'noble park': { lat: -37.9667, lng: 145.1667 },
  'narre warren': { lat: -38.0167, lng: 145.3000 },
  'hallam': { lat: -38.0167, lng: 145.2667 },
  'glen waverley': { lat: -37.8833, lng: 145.1667 },
  'burwood': { lat: -37.8500, lng: 145.1000 },
  'camberwell': { lat: -37.8333, lng: 145.0667 },
  'hawthorn': { lat: -37.8167, lng: 145.0333 },
  'kew': { lat: -37.8000, lng: 145.0333 },
  'collingwood': { lat: -37.8000, lng: 144.9833 },
  'fitzroy': { lat: -37.7833, lng: 144.9833 },
  'carlton': { lat: -37.8000, lng: 144.9667 },
  'parkville': { lat: -37.7833, lng: 144.9500 },
  'north melbourne': { lat: -37.7833, lng: 144.9333 },
  'footscray': { lat: -37.8000, lng: 144.9000 },
  'maribyrnong': { lat: -37.7833, lng: 144.8833 },
  'moonee ponds': { lat: -37.7667, lng: 144.9167 },
  'essendon': { lat: -37.7500, lng: 144.9167 },
  'preston': { lat: -37.7500, lng: 145.0167 },
  'reservoir': { lat: -37.7167, lng: 145.0000 },
  'thomastown': { lat: -37.6833, lng: 145.0167 },
  'broadmeadows': { lat: -37.6833, lng: 144.9167 },
  'coburg': { lat: -37.7333, lng: 144.9667 },
  'brunswick': { lat: -37.7667, lng: 144.9667 },
  'morwell': { lat: -38.2333, lng: 146.3833 },
  'sale': { lat: -38.1000, lng: 147.0667 },
  'lakes entrance': { lat: -37.8833, lng: 148.0000 },
  'orbost': { lat: -37.7000, lng: 148.4667 },
  'mallacoota': { lat: -37.5667, lng: 149.7500 },
  'leongatha': { lat: -38.4833, lng: 145.9500 },
  'wonthaggi': { lat: -38.6000, lng: 145.5833 },
  'swan hill': { lat: -35.3333, lng: 143.5500 },
  'kerang': { lat: -35.7333, lng: 143.9167 },
  'kyabram': { lat: -36.3167, lng: 145.0500 },
  'seymour': { lat: -37.0333, lng: 145.1333 },
  'kilmore': { lat: -37.3000, lng: 144.9500 },
  'wangaratta': { lat: -36.3500, lng: 146.3167 },
  'benalla': { lat: -36.5500, lng: 145.9833 },
  'yarrawonga': { lat: -36.0167, lng: 146.0000 },
  'cobram': { lat: -35.9167, lng: 145.6500 },
  'colac': { lat: -38.3333, lng: 143.5833 },
  'camperdown': { lat: -38.2333, lng: 143.1500 },
  'hamilton': { lat: -37.7333, lng: 142.0167 },
  'portland': { lat: -38.3333, lng: 141.6000 },
  'stawell': { lat: -37.0500, lng: 142.7833 },
  'ararat': { lat: -37.2833, lng: 142.9333 },
  'maryborough': { lat: -37.0500, lng: 143.7333 },
  'castlemaine': { lat: -37.0667, lng: 144.2167 },
  'kyneton': { lat: -37.2500, lng: 144.4500 },
  'bacchus marsh': { lat: -37.6667, lng: 144.4333 },

  // === SOUTH AUSTRALIA ===
  'adelaide': { lat: -34.9285, lng: 138.6007 },
  'port adelaide': { lat: -34.8458, lng: 138.5056 },
  'port augusta': { lat: -32.4931, lng: 137.7658 },
  'ceduna': { lat: -32.1264, lng: 133.6758 },
  'port lincoln': { lat: -34.7289, lng: 135.8597 },
  'whyalla': { lat: -33.0333, lng: 137.5167 },
  'mount gambier': { lat: -37.8294, lng: 140.7828 },
  'murray bridge': { lat: -35.1211, lng: 139.2756 },
  'coober pedy': { lat: -29.0133, lng: 134.7544 },
  'port pirie': { lat: -33.1858, lng: 138.0172 },
  'gawler': { lat: -34.6000, lng: 138.7500 },
  'victor harbor': { lat: -35.5500, lng: 138.6167 },
  'mount barker': { lat: -35.0667, lng: 138.8667 },
  'naracoorte': { lat: -36.9500, lng: 140.7333 },
  'millicent': { lat: -37.6000, lng: 140.3500 },
  'berri': { lat: -34.2833, lng: 140.6000 },
  'renmark': { lat: -34.1833, lng: 140.7500 },
  'loxton': { lat: -34.4500, lng: 140.5667 },
  'kadina': { lat: -33.9667, lng: 137.7167 },
  'wallaroo': { lat: -33.9333, lng: 137.6333 },
  'clare': { lat: -33.8333, lng: 138.6000 },
  'tanunda': { lat: -34.5333, lng: 138.9667 },
  'nuriootpa': { lat: -34.4667, lng: 138.9833 },
  'angaston': { lat: -34.5000, lng: 139.0500 },
  'salisbury': { lat: -34.7667, lng: 138.6333 },
  'elizabeth': { lat: -34.7167, lng: 138.6667 },
  'playford': { lat: -34.6833, lng: 138.7000 },
  'tea tree gully': { lat: -34.8333, lng: 138.7333 },
  'modbury': { lat: -34.8333, lng: 138.6833 },
  'noarlunga': { lat: -35.1333, lng: 138.5000 },
  'christies beach': { lat: -35.1333, lng: 138.4667 },
  'marion': { lat: -35.0167, lng: 138.5500 },
  'unley': { lat: -34.9500, lng: 138.6000 },
  'norwood': { lat: -34.9167, lng: 138.6333 },
  'burnside': { lat: -34.9333, lng: 138.6500 },
  'campbelltown': { lat: -34.8833, lng: 138.6833 },
  'prospect': { lat: -34.8833, lng: 138.6000 },
  'enfield': { lat: -34.8500, lng: 138.6000 },
  'hindmarsh': { lat: -34.9000, lng: 138.5667 },
  'thebarton': { lat: -34.9167, lng: 138.5667 },
  'west torrens': { lat: -34.9167, lng: 138.5500 },
  'woodville': { lat: -34.8833, lng: 138.5333 },

  // === WESTERN AUSTRALIA ===
  'perth': { lat: -31.9505, lng: 115.8605 },
  'halls creek': { lat: -18.2301, lng: 127.7694 },
  'roebourne': { lat: -20.7781, lng: 117.1372 },
  'warburton': { lat: -26.1333, lng: 126.5833 },
  'fitzroy crossing': { lat: -18.1981, lng: 125.5692 },
  'broome': { lat: -17.9614, lng: 122.2359 },
  'kununurra': { lat: -15.7736, lng: 128.7381 },
  'albany': { lat: -35.0269, lng: 117.8837 },
  'bunbury': { lat: -33.3270, lng: 115.6381 },
  'geraldton': { lat: -28.7744, lng: 114.6147 },
  'kalgoorlie': { lat: -30.7489, lng: 121.4658 },
  'mandurah': { lat: -32.5269, lng: 115.7472 },
  'fremantle': { lat: -32.0569, lng: 115.7439 },
  'midland': { lat: -31.8881, lng: 116.0111 },
  'armadale': { lat: -32.1531, lng: 116.0147 },
  'rockingham': { lat: -32.2803, lng: 115.7331 },
  'carnarvon': { lat: -24.8844, lng: 113.6594 },
  'newman': { lat: -23.3578, lng: 119.7394 },
  'port hedland': { lat: -20.3108, lng: 118.6000 },
  'south hedland': { lat: -20.4000, lng: 118.6000 },
  'karratha': { lat: -20.7367, lng: 116.8464 },
  'tom price': { lat: -22.6939, lng: 117.7931 },
  'derby': { lat: -17.3050, lng: 123.6281 },
  'esperance': { lat: -33.8583, lng: 121.8933 },
  'northam': { lat: -31.6500, lng: 116.6667 },
  'collie': { lat: -33.3667, lng: 116.1500 },
  'busselton': { lat: -33.6556, lng: 115.3494 },
  'margaret river': { lat: -33.9500, lng: 115.0667 },
  'meekatharra': { lat: -26.5958, lng: 118.4928 },
  'laverton': { lat: -28.6267, lng: 122.4039 },
  'leonora': { lat: -28.8833, lng: 121.3333 },
  'joondalup': { lat: -31.7469, lng: 115.7667 },
  'wanneroo': { lat: -31.7500, lng: 115.8000 },
  'stirling': { lat: -31.8667, lng: 115.8333 },
  'bayswater': { lat: -31.9167, lng: 115.9167 },
  'belmont': { lat: -31.9500, lng: 115.9333 },
  'canning': { lat: -32.0500, lng: 115.9167 },
  'gosnells': { lat: -32.0833, lng: 116.0000 },
  'mundijong': { lat: -32.2833, lng: 115.9833 },
  'wyndham': { lat: -15.4833, lng: 128.1167 },

  // === NORTHERN TERRITORY ===
  'darwin': { lat: -12.4634, lng: 130.8456 },
  'alice springs': { lat: -23.6980, lng: 133.8807 },
  'groote eylandt': { lat: -13.9806, lng: 136.4603 },
  'lajamanu': { lat: -18.3333, lng: 130.6500 },
  'maningrida': { lat: -12.0558, lng: 134.2339 },
  'ntaria': { lat: -23.9333, lng: 132.7667 },
  'hermannsburg': { lat: -23.9333, lng: 132.7667 },
  'tennant creek': { lat: -19.6497, lng: 134.1911 },
  'katherine': { lat: -14.4650, lng: 132.2636 },
  'nhulunbuy': { lat: -12.1842, lng: 136.7767 },
  'wadeye': { lat: -14.2333, lng: 129.5333 },
  'yuendumu': { lat: -22.2567, lng: 131.7986 },
  'papunya': { lat: -23.2167, lng: 131.9000 },
  'ali curung': { lat: -21.0000, lng: 134.3667 },
  'palmerston': { lat: -12.4881, lng: 130.9833 },
  'jabiru': { lat: -12.6667, lng: 132.8333 },
  'gove': { lat: -12.2833, lng: 136.8167 },
  'alyangula': { lat: -13.8500, lng: 136.4167 },
  'borroloola': { lat: -16.0833, lng: 136.3000 },
  'mataranka': { lat: -14.9333, lng: 133.0667 },
  'elliott': { lat: -17.5500, lng: 133.5500 },
  'ti tree': { lat: -22.1333, lng: 133.4167 },
  'santa teresa': { lat: -24.1333, lng: 134.3833 },
  'kintore': { lat: -23.2833, lng: 129.3667 },
  'docker river': { lat: -24.8667, lng: 129.0833 },
  'yulara': { lat: -25.2333, lng: 130.9833 },
  'aputula': { lat: -25.5000, lng: 134.6333 },
  'angurugu': { lat: -14.0500, lng: 136.5500 },
  'numbulwar': { lat: -14.2667, lng: 135.7500 },
  'ngukurr': { lat: -14.7333, lng: 134.7333 },
  'beswick': { lat: -14.5500, lng: 133.0833 },
  'daly waters': { lat: -16.2500, lng: 133.3667 },
  'timber creek': { lat: -15.6500, lng: 130.4833 },

  // === TASMANIA ===
  'hobart': { lat: -42.8821, lng: 147.3272 },
  'launceston': { lat: -41.4332, lng: 147.1441 },
  'devonport': { lat: -41.1803, lng: 146.3486 },
  'burnie': { lat: -41.0556, lng: 145.9031 },
  'ulverstone': { lat: -41.1667, lng: 146.1833 },
  'kingston': { lat: -42.9833, lng: 147.3000 },
  'glenorchy': { lat: -42.8333, lng: 147.2833 },
  'clarence': { lat: -42.8500, lng: 147.4333 },
  'sorell': { lat: -42.7833, lng: 147.5667 },
  'new norfolk': { lat: -42.7833, lng: 147.0667 },
  'huonville': { lat: -43.0333, lng: 147.0500 },
  'geeveston': { lat: -43.1667, lng: 146.9167 },
  'queenstown': { lat: -42.0833, lng: 145.5500 },
  'strahan': { lat: -42.1500, lng: 145.3333 },
  'st helens': { lat: -41.3167, lng: 148.2500 },
  'scottsdale': { lat: -41.1667, lng: 147.5167 },
  'george town': { lat: -41.1000, lng: 146.8333 },
  'deloraine': { lat: -41.5167, lng: 146.6500 },
  'wynyard': { lat: -40.9833, lng: 145.7167 },
  'smithton': { lat: -40.8333, lng: 145.1167 },

  // === ACT ===
  'canberra': { lat: -35.2809, lng: 149.1300 },
  'queanbeyan': { lat: -35.3500, lng: 149.2333 },
  'belconnen': { lat: -35.2333, lng: 149.0667 },
  'woden': { lat: -35.3500, lng: 149.0833 },
  'tuggeranong': { lat: -35.4167, lng: 149.0667 },
  'gungahlin': { lat: -35.1833, lng: 149.1333 },
  'fyshwick': { lat: -35.3333, lng: 149.1667 },
  'mitchell': { lat: -35.2167, lng: 149.1333 },
  'civic': { lat: -35.2809, lng: 149.1300 },

  // === STATE CENTERS (fallback) ===
  'queensland': { lat: -20.9176, lng: 142.7028 },
  'qld': { lat: -20.9176, lng: 142.7028 },
  'new south wales': { lat: -31.2532, lng: 146.9211 },
  'nsw': { lat: -31.2532, lng: 146.9211 },
  'victoria': { lat: -37.4713, lng: 144.7852 },
  'vic': { lat: -37.4713, lng: 144.7852 },
  'south australia': { lat: -30.0002, lng: 136.2092 },
  'sa': { lat: -30.0002, lng: 136.2092 },
  'western australia': { lat: -27.6728, lng: 121.6283 },
  'wa': { lat: -27.6728, lng: 121.6283 },
  'northern territory': { lat: -19.4914, lng: 132.5510 },
  'nt': { lat: -19.4914, lng: 132.5510 },
  'tasmania': { lat: -41.4545, lng: 145.9707 },
  'tas': { lat: -41.4545, lng: 145.9707 },
  'australian capital territory': { lat: -35.2809, lng: 149.1300 },
  'act': { lat: -35.2809, lng: 149.1300 }
};

// State abbreviation to full name mapping
const STATE_MAP = {
  'qld': 'queensland',
  'nsw': 'new south wales',
  'vic': 'victoria',
  'sa': 'south australia',
  'wa': 'western australia',
  'nt': 'northern territory',
  'tas': 'tasmania',
  'act': 'australian capital territory'
};

function geocodeService(service) {
  const city = service.location_city?.toLowerCase().trim();
  const state = service.location_state?.toLowerCase().trim();

  // Try exact city match first
  if (city && LOCATION_COORDINATES[city]) {
    return LOCATION_COORDINATES[city];
  }

  // Try partial city match (e.g., "Brisbane CBD" -> "brisbane")
  if (city) {
    // Clean up city name
    const cleanCity = city
      .replace(/\s+(cbd|central|metro|north|south|east|west|inner|outer)$/i, '')
      .trim();

    if (cleanCity && LOCATION_COORDINATES[cleanCity]) {
      return LOCATION_COORDINATES[cleanCity];
    }

    // Try matching first word (e.g., "South Brisbane" -> "south brisbane")
    for (const [knownLocation, coords] of Object.entries(LOCATION_COORDINATES)) {
      if (coords && (city.includes(knownLocation) || knownLocation.includes(city.split(' ')[0]))) {
        return coords;
      }
    }
  }

  // Fallback to state center with slight randomization
  if (state) {
    const fullStateName = STATE_MAP[state] || state;
    const stateCoords = LOCATION_COORDINATES[fullStateName] || LOCATION_COORDINATES[state];

    if (stateCoords) {
      // Add slight randomization to prevent markers stacking
      return {
        lat: stateCoords.lat + (Math.random() - 0.5) * 0.8,
        lng: stateCoords.lng + (Math.random() - 0.5) * 0.8
      };
    }
  }

  return null;
}

async function main() {
  console.log('============================================================');
  console.log('GEOCODING SERVICES');
  console.log('============================================================\n');

  // Get services without coordinates
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, location_city, location_state, latitude, longitude')
    .is('latitude', null);

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  if (!services || services.length === 0) {
    console.log('All services already have coordinates!');

    // Show stats
    const { count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null);

    console.log(`\n${count} services with coordinates`);
    return;
  }

  console.log(`Found ${services.length} services needing geocoding\n`);

  let geocoded = 0;
  let failed = 0;
  const failedServices = [];

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, Math.min(i + batchSize, services.length));
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(services.length/batchSize)}...`);

    const updates = [];
    for (const service of batch) {
      const coords = geocodeService(service);

      if (coords) {
        updates.push({
          id: service.id,
          latitude: coords.lat,
          longitude: coords.lng
        });
        geocoded++;
      } else {
        failedServices.push({ name: service.name, city: service.location_city, state: service.location_state });
        failed++;
      }
    }

    // Batch update
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          latitude: update.latitude,
          longitude: update.longitude
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`  Failed to update ${update.id}:`, updateError.message);
      }
    }
  }

  console.log('\n============================================================');
  console.log('GEOCODING SUMMARY');
  console.log('============================================================');
  console.log(`Total services: ${services.length}`);
  console.log(`Geocoded: ${geocoded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${Math.round(geocoded / services.length * 100)}%`);

  if (failedServices.length > 0 && failedServices.length <= 20) {
    console.log('\nServices that could not be geocoded:');
    failedServices.forEach(s => {
      console.log(`  - ${s.name} (${s.city || 'no city'}, ${s.state || 'no state'})`);
    });
  } else if (failedServices.length > 20) {
    console.log(`\n${failedServices.length} services could not be geocoded (no city/state info)`);
  }

  // Show distribution by state
  const { data: stats } = await supabase
    .from('services')
    .select('location_state')
    .not('latitude', 'is', null);

  if (stats) {
    const byState = {};
    stats.forEach(s => {
      const state = s.location_state || 'Unknown';
      byState[state] = (byState[state] || 0) + 1;
    });
    console.log('\nServices by state:');
    Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });
  }

  console.log('\nServices are now ready for map-based discovery!');
}

main().catch(console.error);
