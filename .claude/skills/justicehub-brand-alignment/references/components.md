# Component Patterns

## Data Card
```tsx
<div className="data-card bg-white border-2 border-black p-6">
  <div className="font-mono text-6xl font-bold mb-4">95%</div>
  <h3 className="text-xl font-bold mb-2">PROGRAM SUCCESS</h3>
  <p className="text-gray-700">Description</p>
</div>
```

## SimCity Admin Card
```tsx
<div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
  <div className="p-6">{/* Content */}</div>
</div>
```

## Comparison Cards
```tsx
{/* Success */}
<div className="bg-blue-50 border-l-8 border-blue-800 p-6">
  <div className="font-mono text-5xl font-bold text-blue-800">78%</div>
  <h3 className="font-bold">COMMUNITY PROGRAMS</h3>
</div>

{/* Failure */}
<div className="bg-orange-50 border-l-8 border-orange-600 p-6">
  <div className="font-mono text-5xl font-bold text-orange-600">15.5%</div>
  <h3 className="font-bold">DETENTION</h3>
</div>
```

## CTAs
```tsx
{/* Primary */}
<Link href="/services" className="cta-primary">FIND HELP NOW</Link>

{/* Secondary */}
<Link href="#data" className="cta-secondary">SEE THE DATA</Link>

{/* Steward */}
<Link className="px-8 py-4 bg-green-700 text-white font-bold border-2 border-black hover:bg-green-800">
  BECOME A STEWARD
</Link>
```

## Hero Stat
```tsx
<div className="impact-number">
  <div className="hero-stat">{stat.number}</div>
  <p className="text-xl md:text-2xl mt-4">{stat.context}</p>
</div>
```
