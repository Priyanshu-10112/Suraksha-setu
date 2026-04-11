import { useState, useEffect } from 'react'
import { useSurveillance } from '../../context/SurveillanceContext'

export default function FaceRecognition() {
  const { t } = useSurveillance()
  const [criminals, setCriminals] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false)
  const [selectedCriminal, setSelectedCriminal] = useState(null)
  const [newCriminal, setNewCriminal] = useState({ name: '', photos: [] })
  const [newPhotos, setNewPhotos] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [newPhotosPreviews, setNewPhotosPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState({})

  useEffect(() => {
    fetchCriminals()
  }, [])

  const fetchCriminals = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/criminals/`)
      const data = await response.json()
      setCriminals(data.criminals || [])
    } catch (err) {
      console.error('Failed to fetch criminals:', err)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.toLowerCase()
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')
      })

      if (validFiles.length !== files.length) {
        setError('Only JPG, JPEG, PNG files are allowed')
      }

      setNewCriminal({ ...newCriminal, photos: validFiles })
      
      const previews = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
      })
      
      Promise.all(previews).then(setImagePreviews)
    }
  }

  const handleAddCriminal = async (e) => {
    e.preventDefault()
    if (!newCriminal.name || newCriminal.photos.length === 0) {
      setError('Name and at least one photo are required')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('name', newCriminal.name)
    
    newCriminal.photos.forEach((photo) => {
      formData.append('photos', photo)
    })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/criminals/add`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await fetchCriminals()
        setShowAddModal(false)
        setNewCriminal({ name: '', photos: [] })
        setImagePreviews([])
        alert(data.message || 'Criminal added successfully')
      } else {
        const errorMsg = data.detail || data.message || 'Failed to add criminal'
        setError(errorMsg)
        console.error('Add criminal error:', data)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      console.error('Network error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCriminal = async (criminalName) => {
    if (!window.confirm('Are you sure you want to delete this criminal record?')) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/criminals/${criminalName}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchCriminals()
      } else {
        alert('Failed to delete criminal')
      }
    } catch (err) {
      alert('Network error: ' + err.message)
    }
  }

  const handleAddPhotos = (criminal) => {
    setSelectedCriminal(criminal)
    setShowAddPhotosModal(true)
    setNewPhotos([])
    setNewPhotosPreviews([])
    setError('')
  }

  const handleNewPhotosChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.toLowerCase()
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')
      })

      if (validFiles.length !== files.length) {
        setError('Only JPG, JPEG, PNG files are allowed')
      }

      setNewPhotos(validFiles)
      
      const previews = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
      })
      
      Promise.all(previews).then(setNewPhotosPreviews)
    }
  }

  const handleSubmitNewPhotos = async (e) => {
    e.preventDefault()
    if (newPhotos.length === 0) {
      setError('Please select at least one photo')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    
    newPhotos.forEach((photo) => {
      formData.append('photos', photo)
    })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/criminals/${selectedCriminal.name}/photos`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await fetchCriminals()
        setShowAddPhotosModal(false)
        setSelectedCriminal(null)
        setNewPhotos([])
        setNewPhotosPreviews([])
        alert(data.message || 'Photos added successfully')
      } else {
        const errorMsg = data.detail || data.message || 'Failed to add photos'
        setError(errorMsg)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-inner">
      <div className="section-header">
        <div className="section-title">🔍 {t('Face Recognition Database', 'चेहरा पहचान डेटाबेस')}</div>
        <button className="add-criminal-btn" onClick={() => setShowAddModal(true)}>
          + Add Criminal
        </button>
      </div>

      <div className="stats-row">
        <div key="total" className="stat-card stat-danger">
          <div className="stat-val">{criminals.length}</div>
          <div className="stat-label">Total Criminals</div>
        </div>
        <div key="active" className="stat-card stat-ok">
          <div className="stat-val">{criminals.length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div key="photos" className="stat-card stat-warn">
          <div className="stat-val">{criminals.reduce((sum, c) => sum + (c.photos?.length || 0), 0)}</div>
          <div className="stat-label">Total Photos</div>
        </div>
      </div>

      <div className="criminal-grid">
        {criminals.map(criminal => (
          <div key={criminal.name} className="criminal-card">
            <div className="criminal-card-header">
              <span className="criminal-status-badge" style={{ 
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e'
              }}>
                ✓ ACTIVE
              </span>
              <div className="criminal-card-actions">
                <button 
                  className="criminal-add-photo-btn" 
                  onClick={() => handleAddPhotos(criminal)}
                  title="Add more photos"
                >
                  + Photo
                </button>
                <button 
                  className="criminal-delete-btn" 
                  onClick={() => handleDeleteCriminal(criminal.name)}
                  title="Delete criminal"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="criminal-image-container">
              {criminal.photos && criminal.photos.length > 0 ? (
                <>
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${criminal.photos[selectedPhotos[criminal.name] || 0]}`}
                    alt={criminal.display_name || criminal.name}
                    className="criminal-image"
                    onError={(e) => { 
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div class="criminal-image-placeholder">Image Not Found</div>'
                    }}
                  />
                  {criminal.photos.length > 1 && (
                    <div className="photo-nav-arrows">
                      <button 
                        className="photo-nav-btn photo-nav-prev"
                        onClick={() => setSelectedPhotos(prev => ({
                          ...prev,
                          [criminal.name]: ((prev[criminal.name] || 0) - 1 + criminal.photos.length) % criminal.photos.length
                        }))}
                      >
                        ‹
                      </button>
                      <button 
                        className="photo-nav-btn photo-nav-next"
                        onClick={() => setSelectedPhotos(prev => ({
                          ...prev,
                          [criminal.name]: ((prev[criminal.name] || 0) + 1) % criminal.photos.length
                        }))}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="criminal-image-placeholder">No Image</div>
              )}
            </div>

            {criminal.photos && criminal.photos.length > 1 && (
              <div className="photo-thumbnails">
                {criminal.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`${import.meta.env.VITE_API_URL}${photo}`}
                    alt={`${criminal.display_name || criminal.name} ${index + 1}`}
                    className={`photo-thumbnail ${(selectedPhotos[criminal.name] || 0) === index ? 'active' : ''}`}
                    onClick={() => setSelectedPhotos(prev => ({ ...prev, [criminal.name]: index }))}
                  />
                ))}
              </div>
            )}

            <div className="criminal-card-body">
              <div className="criminal-name">{criminal.display_name || criminal.name}</div>
              
              {criminal.photos && criminal.photos.length > 1 && (
                <div className="photo-count-badge">
                  📸 {criminal.photos.length} photos
                </div>
              )}
              
              <div className="criminal-meta">
                {criminal.photos && criminal.photos.length > 0 && (
                  <div key="photos" className="criminal-meta-item">
                    <span className="meta-label">Photos:</span>
                    <span className="meta-value">{criminal.photos.length}</span>
                  </div>
                )}
                {criminal.face_count && (
                  <div key="faces" className="criminal-meta-item">
                    <span className="meta-label">Trained Faces:</span>
                    <span className="meta-value">{criminal.face_count}</span>
                  </div>
                )}
                {criminal.detection_count > 0 && (
                  <div key="detections" className="criminal-meta-item">
                    <span className="meta-label">Detections:</span>
                    <span className="meta-value">{criminal.detection_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {criminals.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No Criminals in Database</div>
            <div className="empty-subtitle">Add criminals to start face recognition</div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card modal-card-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Criminal to Database</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form className="modal-body" onSubmit={handleAddCriminal}>
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter criminal name"
                  value={newCriminal.name}
                  onChange={e => setNewCriminal({ ...newCriminal, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photos * (Multiple allowed)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  className="form-input"
                  onChange={handleImageChange}
                  required
                />
                {newCriminal.photos.length > 0 && (
                  <p className="file-count">{newCriminal.photos.length} photo(s) selected</p>
                )}
                {imagePreviews.length > 0 && (
                  <div className="image-preview-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="preview-item">
                        <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                        <span className="preview-filename">{newCriminal.photos[index]?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-cancel" 
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Criminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPhotosModal && selectedCriminal && (
        <div className="modal-overlay" onClick={() => setShowAddPhotosModal(false)}>
          <div className="modal-card modal-card-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Photos for {selectedCriminal.display_name || selectedCriminal.name}</div>
              <button className="modal-close" onClick={() => setShowAddPhotosModal(false)}>✕</button>
            </div>

            <form className="modal-body" onSubmit={handleSubmitNewPhotos}>
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Photos * (Multiple allowed)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  className="form-input"
                  onChange={handleNewPhotosChange}
                  required
                />
                {newPhotos.length > 0 && (
                  <p className="file-count">{newPhotos.length} photo(s) selected</p>
                )}
                {newPhotosPreviews.length > 0 && (
                  <div className="image-preview-grid">
                    {newPhotosPreviews.map((preview, index) => (
                      <div key={index} className="preview-item">
                        <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                        <span className="preview-filename">{newPhotos[index]?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-cancel" 
                  onClick={() => setShowAddPhotosModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Photos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
