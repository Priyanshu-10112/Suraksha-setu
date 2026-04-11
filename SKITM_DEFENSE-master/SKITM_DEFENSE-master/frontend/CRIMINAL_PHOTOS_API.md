# Criminal Photos API - Frontend Guide

## 📸 Get Criminals with All Photos

### Endpoint
```
GET /api/criminals/
```

### Response
```json
{
  "success": true,
  "criminals": [
    {
      "name": "Kshitij",
      "display_name": "Kshitij",
      "face_count": 1,
      "photos": [
        "/api/criminals/photo/Kshitij/photo1.jpeg",
        "/api/criminals/photo/Kshitij/photo2.jpeg",
        "/api/criminals/photo/Kshitij/photo3.jpeg",
        "/api/criminals/photo/Kshitij/photo4.jpeg"
      ],
      "photo_url": "/api/criminals/photo/Kshitij/photo1.jpeg"
    }
  ],
  "count": 1,
  "total_faces": 3
}
```

### Fields
- `photos` - **Array of ALL photo URLs** (NEW)
- `photo_url` - First photo URL (for quick display)
- `face_count` - Number of faces loaded in system
- `display_name` - Formatted name (spaces instead of underscores)

## 🖼️ Display All Photos

### React - Photo Gallery
```jsx
function CriminalCard({ criminal }) {
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  
  return (
    <div className="criminal-card">
      {/* Main Photo */}
      <div className="main-photo">
        <img 
          src={`http://localhost:8000${criminal.photos[selectedPhoto]}`}
          alt={criminal.display_name}
        />
      </div>
      
      {/* Photo Thumbnails */}
      <div className="photo-thumbnails">
        {criminal.photos.map((photo, index) => (
          <img
            key={index}
            src={`http://localhost:8000${photo}`}
            alt={`${criminal.display_name} ${index + 1}`}
            className={selectedPhoto === index ? 'active' : ''}
            onClick={() => setSelectedPhoto(index)}
          />
        ))}
      </div>
      
      <h3>{criminal.display_name}</h3>
      <p>{criminal.photos.length} photos | {criminal.face_count} faces loaded</p>
    </div>
  );
}
```

### React - Carousel
```jsx
function CriminalCarousel({ criminal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % criminal.photos.length);
  };
  
  const prevPhoto = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? criminal.photos.length - 1 : prev - 1
    );
  };
  
  return (
    <div className="carousel">
      <button onClick={prevPhoto}>←</button>
      
      <img 
        src={`http://localhost:8000${criminal.photos[currentIndex]}`}
        alt={criminal.display_name}
      />
      
      <button onClick={nextPhoto}>→</button>
      
      <div className="indicator">
        {currentIndex + 1} / {criminal.photos.length}
      </div>
    </div>
  );
}
```

### Simple Grid - All Photos
```jsx
function CriminalPhotos({ criminal }) {
  return (
    <div className="criminal-photos">
      <h3>{criminal.display_name}</h3>
      <div className="photos-grid">
        {criminal.photos.map((photo, index) => (
          <img
            key={index}
            src={`http://localhost:8000${photo}`}
            alt={`${criminal.display_name} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
```

## 🎨 CSS Styling

```css
/* Photo Gallery */
.criminal-card {
  background: #fff;
  border: 2px solid #ff0000;
  border-radius: 10px;
  padding: 20px;
  max-width: 400px;
}

.main-photo {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-thumbnails {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  overflow-x: auto;
}

.photo-thumbnails img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 5px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.photo-thumbnails img:hover {
  border-color: #ff0000;
  transform: scale(1.1);
}

.photo-thumbnails img.active {
  border-color: #ff0000;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

/* Carousel */
.carousel {
  position: relative;
  width: 100%;
  height: 400px;
}

.carousel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.carousel button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 15px 20px;
  font-size: 24px;
  cursor: pointer;
  border-radius: 5px;
}

.carousel button:first-child {
  left: 10px;
}

.carousel button:last-child {
  right: 10px;
}

.indicator {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
}

/* Grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.photos-grid img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #ff0000;
}
```

## 📱 Complete Dashboard Example

```jsx
function CriminalDashboard() {
  const [criminals, setCriminals] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/criminals/')
      .then(res => res.json())
      .then(data => setCriminals(data.criminals));
  }, []);
  
  return (
    <div className="dashboard">
      <h2>🚨 Criminal Watchlist</h2>
      
      <div className="criminals-list">
        {criminals.map(criminal => (
          <div key={criminal.name} className="criminal-item">
            {/* Show all photos */}
            <div className="photos-section">
              <h3>{criminal.display_name}</h3>
              <div className="photos-grid">
                {criminal.photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={`http://localhost:8000${photo}`}
                      alt={`${criminal.display_name} ${index + 1}`}
                    />
                    <span className="photo-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="stats">
              <span>📸 {criminal.photos.length} photos</span>
              <span>👤 {criminal.face_count} faces loaded</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔍 Use Cases

### 1. Show First Photo Only (Quick Display)
```jsx
<img src={`http://localhost:8000${criminal.photo_url}`} />
```

### 2. Show All Photos (Gallery)
```jsx
{criminal.photos.map((photo, i) => (
  <img key={i} src={`http://localhost:8000${photo}`} />
))}
```

### 3. Photo Count Badge
```jsx
<span className="badge">{criminal.photos.length} photos</span>
```

### 4. Slideshow
```jsx
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentPhoto((prev) => (prev + 1) % criminal.photos.length);
  }, 3000); // Change every 3 seconds
  
  return () => clearInterval(interval);
}, [criminal.photos.length]);
```

## ✅ Summary

**What Changed:**
- ✅ `photos` array added - contains ALL photo URLs
- ✅ `photo_url` still available - first photo for quick display
- ✅ All photos from criminal's folder included

**Frontend Options:**
1. **Quick Display**: Use `photo_url` (first photo)
2. **Gallery**: Loop through `photos` array
3. **Carousel**: Navigate through `photos` with prev/next
4. **Grid**: Display all photos in grid layout

**Example:**
- Kshitij has 4 photos
- `photos` array has 4 URLs
- `photo_url` points to first photo
- Frontend can display all 4 or just 1

Ab frontend pe saari photos dikha sakte ho! 🎉
