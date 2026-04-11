# Add Criminal API - Frontend Guide

## 🎯 Overview

Frontend se directly criminal add/delete kar sakte ho with photos upload.

## 📤 Add Criminal

### Endpoint
```
POST /api/criminals/add
```

### Request (Multipart Form Data)
```
Content-Type: multipart/form-data

Fields:
- name: string (Criminal name)
- photos: File[] (Multiple image files)
```

### Response
```json
{
  "success": true,
  "message": "Criminal 'John Doe' added successfully",
  "criminal": {
    "name": "John_Doe",
    "display_name": "John Doe",
    "photos_count": 3,
    "photos": [
      "/api/criminals/photo/John_Doe/photo_1.jpg",
      "/api/criminals/photo/John_Doe/photo_2.jpg",
      "/api/criminals/photo/John_Doe/photo_3.jpg"
    ]
  }
}
```

## 🗑️ Delete Criminal

### Endpoint
```
DELETE /api/criminals/{criminal_name}
```

### Example
```
DELETE /api/criminals/Kshitij
```

### Response
```json
{
  "success": true,
  "message": "Criminal 'Kshitij' deleted successfully"
}
```

## 💻 Frontend Implementation

### React - Add Criminal Form

```jsx
import React, { useState } from 'react';

function AddCriminalForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate
    if (!name.trim()) {
      setError('Criminal name is required');
      setLoading(false);
      return;
    }

    if (photos.length === 0) {
      setError('At least one photo is required');
      setLoading(false);
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('name', name);
    
    // Add all photos
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    try {
      const response = await fetch('http://localhost:8000/api/criminals/add', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setName('');
        setPhotos([]);
        if (onSuccess) onSuccess(data.criminal);
      } else {
        setError(data.detail || 'Failed to add criminal');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');
    });

    if (validFiles.length !== files.length) {
      setError('Only JPG, JPEG, PNG files are allowed');
    }

    setPhotos(validFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="add-criminal-form">
      <h3>➕ Add New Criminal</h3>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label>Criminal Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., John Doe"
          required
        />
      </div>

      <div className="form-group">
        <label>Photos * (Multiple allowed)</label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          onChange={handlePhotoChange}
          required
        />
        {photos.length > 0 && (
          <p className="file-count">{photos.length} photo(s) selected</p>
        )}
      </div>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="photo-preview">
          {photos.map((photo, index) => (
            <div key={index} className="preview-item">
              <img 
                src={URL.createObjectURL(photo)} 
                alt={`Preview ${index + 1}`}
              />
              <span>{photo.name}</span>
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Criminal'}
      </button>
    </form>
  );
}

export default AddCriminalForm;
```

### React - Delete Criminal

```jsx
function CriminalCard({ criminal, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${criminal.display_name}?`)) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/criminals/${criminal.name}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        if (onDelete) onDelete(criminal.name);
      } else {
        alert('Failed to delete criminal');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="criminal-card">
      <img src={`http://localhost:8000${criminal.photo_url}`} />
      <h3>{criminal.display_name}</h3>
      <button 
        onClick={handleDelete} 
        disabled={deleting}
        className="delete-btn"
      >
        {deleting ? 'Deleting...' : '🗑️ Delete'}
      </button>
    </div>
  );
}
```

### Complete Dashboard with Add/Delete

```jsx
function CriminalManagement() {
  const [criminals, setCriminals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCriminals();
  }, []);

  const loadCriminals = async () => {
    const res = await fetch('http://localhost:8000/api/criminals/');
    const data = await res.json();
    setCriminals(data.criminals);
  };

  const handleCriminalAdded = (newCriminal) => {
    loadCriminals(); // Reload list
    setShowAddForm(false);
  };

  const handleCriminalDeleted = (name) => {
    setCriminals(criminals.filter(c => c.name !== name));
  };

  return (
    <div className="criminal-management">
      <div className="header">
        <h2>🚨 Criminal Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '➕ Add Criminal'}
        </button>
      </div>

      {showAddForm && (
        <AddCriminalForm onSuccess={handleCriminalAdded} />
      )}

      <div className="criminals-grid">
        {criminals.map(criminal => (
          <CriminalCard
            key={criminal.name}
            criminal={criminal}
            onDelete={handleCriminalDeleted}
          />
        ))}
      </div>
    </div>
  );
}
```

## 🎨 CSS Styling

```css
.add-criminal-form {
  background: #fff;
  border: 2px solid #ff0000;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.form-group input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px dashed #ff0000;
  border-radius: 5px;
  cursor: pointer;
}

.file-count {
  margin-top: 5px;
  color: #666;
  font-size: 14px;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.preview-item {
  text-align: center;
}

.preview-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
  border: 2px solid #ff0000;
}

.preview-item span {
  display: block;
  font-size: 12px;
  margin-top: 5px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

button[type="submit"] {
  background: #ff0000;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

button[type="submit"]:hover {
  background: #cc0000;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.delete-btn {
  background: #ff0000;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.delete-btn:hover {
  background: #cc0000;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  border-left: 4px solid #c62828;
}
```

## 📝 Vanilla JavaScript Example

```javascript
// Add Criminal
async function addCriminal(name, photoFiles) {
  const formData = new FormData();
  formData.append('name', name);
  
  photoFiles.forEach(file => {
    formData.append('photos', file);
  });
  
  const response = await fetch('http://localhost:8000/api/criminals/add', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Delete Criminal
async function deleteCriminal(criminalName) {
  const response = await fetch(
    `http://localhost:8000/api/criminals/${criminalName}`,
    { method: 'DELETE' }
  );
  
  return await response.json();
}

// Usage
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const photos = document.getElementById('photos').files;
  
  const result = await addCriminal(name, Array.from(photos));
  
  if (result.success) {
    alert(result.message);
    location.reload();
  } else {
    alert('Error: ' + result.detail);
  }
});
```

## ✅ Validation Rules

### Name
- Required
- Cannot be empty
- Special characters removed
- Spaces converted to underscores
- Must be unique (no duplicates)

### Photos
- At least 1 photo required
- Multiple photos allowed (recommended 3-5)
- Allowed formats: .jpg, .jpeg, .png
- Each photo should contain a clear face

## 🔄 Workflow

### Add Criminal
```
1. User fills form (name + photos)
2. Frontend validates input
3. Creates FormData with name and photos
4. POST to /api/criminals/add
5. Backend creates folder: dataset/criminals/{name}/
6. Saves photos as photo_1.jpg, photo_2.jpg, etc.
7. Reloads face recognition dataset
8. Returns success with photo URLs
9. Frontend refreshes criminal list
```

### Delete Criminal
```
1. User clicks delete button
2. Confirmation dialog
3. DELETE to /api/criminals/{name}
4. Backend deletes folder and all photos
5. Reloads face recognition dataset
6. Returns success
7. Frontend removes from list
```

## 🚨 Error Handling

### Common Errors

**400 - Bad Request**
- Empty name
- No photos uploaded
- Invalid file type
- Criminal already exists

**404 - Not Found**
- Criminal doesn't exist (delete)

**500 - Server Error**
- Failed to save photos
- Failed to load faces (no clear faces in photos)
- File system error

### Frontend Error Display

```jsx
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  
  // Success
  return data;
} catch (error) {
  // Show error to user
  setError(error.message);
}
```

## 📊 Complete Example

```jsx
import React, { useState, useEffect } from 'react';

function CriminalManagementPage() {
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCriminals();
  }, []);

  const loadCriminals = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/criminals/');
      const data = await res.json();
      setCriminals(data.criminals);
    } catch (err) {
      console.error('Failed to load criminals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (name, photos) => {
    const formData = new FormData();
    formData.append('name', name);
    photos.forEach(photo => formData.append('photos', photo));

    const res = await fetch('http://localhost:8000/api/criminals/add', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    
    if (data.success) {
      loadCriminals();
      setShowForm(false);
      alert(data.message);
    } else {
      throw new Error(data.detail);
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete ${name}?`)) return;

    const res = await fetch(`http://localhost:8000/api/criminals/${name}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    
    if (data.success) {
      loadCriminals();
      alert(data.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page">
      <header>
        <h1>🚨 Criminal Management</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '➕ Add Criminal'}
        </button>
      </header>

      {showForm && (
        <AddCriminalForm onSubmit={handleAdd} />
      )}

      <div className="criminals-list">
        {criminals.map(criminal => (
          <CriminalCard
            key={criminal.name}
            criminal={criminal}
            onDelete={() => handleDelete(criminal.name)}
          />
        ))}
      </div>
    </div>
  );
}
```

## ✅ Summary

**New APIs:**
- ✅ `POST /api/criminals/add` - Add criminal with photos
- ✅ `DELETE /api/criminals/{name}` - Delete criminal

**Features:**
- ✅ Upload multiple photos at once
- ✅ Automatic face detection validation
- ✅ Auto-reload dataset after add/delete
- ✅ Name validation and sanitization
- ✅ Duplicate prevention
- ✅ Complete error handling

**Frontend Can:**
- ✅ Add new criminals with photos
- ✅ Delete existing criminals
- ✅ View all criminals with photos
- ✅ No need to access server filesystem

Ab frontend se complete criminal management ho sakta hai! 🎉
