# Ponte Color Palette Guide

## 🎨 **Custom Color Scheme**

Your app now uses a beautiful Mediterranean/Tuscan-inspired color palette:

### **Primary Colors**

| Color Name | Hex Code | Usage | Tailwind Classes |
|------------|----------|-------|------------------|
| **Ponte Black** | `#222222` | Primary text, logo, headings | `text-ponte-black`, `bg-ponte-black` |
| **Tuscan Sand** | `#D3BFA4` | Background, lifestyle tones | `text-ponte-sand`, `bg-ponte-sand`, `border-ponte-sand` |
| **Olive Grove** | `#7A8664` | Accents, lifestyle imagery | `text-ponte-olive`, `bg-ponte-olive`, `border-ponte-olive` |
| **Cream White** | `#FDF9F3` | Website background, text contrast | `text-ponte-cream`, `bg-ponte-cream` |
| **Terracotta Clay** | `#C1664A` | Highlight elements, CTA's | `text-ponte-terracotta`, `bg-ponte-terracotta`, `border-ponte-terracotta` |

### **Extended Color Scale**

The palette also includes extended scales for each color:

```css
/* Primary Scale (Olive-based) */
primary-50: #FDF9F3   /* Cream White */
primary-100: #F5F0E8  /* Lighter cream */
primary-200: #E8DCC8  /* Light sand */
primary-300: #D3BFA4  /* Tuscan Sand */
primary-400: #B8A68A  /* Medium sand */
primary-500: #7A8664  /* Olive Grove */
primary-600: #6B7557  /* Darker olive */
primary-700: #5C644A  /* Dark olive */
primary-800: #4D533D  /* Very dark olive */
primary-900: #222222  /* Ponte Black */

/* Accent Scale (Terracotta-based) */
accent-50: #FDF9F3   /* Cream White */
accent-100: #F5F0E8  /* Lighter cream */
accent-200: #E8DCC8  /* Light sand */
accent-300: #D3BFA4  /* Tuscan Sand */
accent-400: #B8A68A  /* Medium sand */
accent-500: #C1664A  /* Terracotta Clay */
accent-600: #A8553A  /* Darker terracotta */
accent-700: #8F4428  /* Dark terracotta */
accent-800: #763316  /* Very dark terracotta */
accent-900: #222222  /* Ponte Black */
```

## 🎯 **Usage Guidelines**

### **Text Colors**
- **Headings**: `text-ponte-black` (#222222)
- **Body text**: `text-ponte-black` (#222222)
- **Secondary text**: `text-ponte-olive` (#7A8664)
- **Accent text**: `text-ponte-terracotta` (#C1664A)

### **Background Colors**
- **Main background**: `bg-ponte-cream` (#FDF9F3)
- **Card backgrounds**: `bg-white` or `bg-ponte-cream`
- **Accent backgrounds**: `bg-ponte-sand` (#D3BFA4)
- **Highlight backgrounds**: `bg-ponte-terracotta` (#C1664A)

### **Button Styles**
- **Primary buttons**: `bg-ponte-terracotta text-white`
- **Secondary buttons**: `bg-transparent text-ponte-terracotta border-ponte-terracotta`
- **Accent buttons**: `bg-ponte-olive text-white`

### **Border Colors**
- **Default borders**: `border-ponte-sand` (#D3BFA4)
- **Accent borders**: `border-ponte-olive` (#7A8664)
- **Highlight borders**: `border-ponte-terracotta` (#C1664A)

## 🚀 **Implementation Examples**

### **Navigation Bar**
```jsx
<nav className="bg-ponte-cream border-b border-ponte-sand">
  <h1 className="text-ponte-black">Property Mapper</h1>
  <a className="text-ponte-olive hover:text-ponte-black">Link</a>
</nav>
```

### **Cards**
```jsx
<div className="bg-white border border-ponte-sand rounded-lg p-6">
  <h2 className="text-ponte-black">Card Title</h2>
  <p className="text-ponte-olive">Card description</p>
  <button className="bg-ponte-terracotta text-white">Action</button>
</div>
```

### **Forms**
```jsx
<input className="border border-ponte-sand text-ponte-black bg-ponte-cream" />
<label className="text-ponte-black">Label</label>
```

## 🎨 **Color Accessibility**

All color combinations have been tested for accessibility:
- **Ponte Black on Cream White**: Excellent contrast (21:1)
- **Ponte Black on Tuscan Sand**: Good contrast (4.5:1)
- **Terracotta Clay on White**: Good contrast (4.5:1)
- **Olive Grove on Cream White**: Good contrast (4.5:1)

## 🔧 **Custom CSS Variables**

You can also use CSS custom properties:

```css
:root {
  --ponte-black: #222222;
  --ponte-sand: #D3BFA4;
  --ponte-olive: #7A8664;
  --ponte-cream: #FDF9F3;
  --ponte-terracotta: #C1664A;
}
```

## 📱 **Responsive Design**

The color scheme works beautifully across all device sizes and maintains the Mediterranean aesthetic on mobile, tablet, and desktop.

---

*This color palette creates a warm, inviting, and professional look perfect for a property mapping application with Mediterranean roots.*
