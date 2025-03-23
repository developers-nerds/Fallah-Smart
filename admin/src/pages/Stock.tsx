// import { useState, useEffect } from 'react'
// import { Tabs, Tab, Button, Spinner, Alert, Modal, Form, Card, Row, Col } from 'react-bootstrap'
// import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa'
// import { useAppSelector } from '../redux/store'
// import stockService, { StockItem } from '../services/stockService'
// import { Pie, Bar } from 'react-chartjs-2'
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'

// // Register ChartJS components
// ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// // Type for dashboard summary
// interface DashboardSummary {
//   totalItems: {
//     animals: number;
//     pesticides: number;
//     equipment: number;
//     feeds: number;
//     fertilizers: number;
//     harvests: number;
//     seeds: number;
//     tools: number;
//     total: number;
//   };
//   totalValue: {
//     animals: number;
//     pesticides: number;
//     equipment: number;
//     feeds: number;
//     fertilizers: number;
//     harvests: number;
//     seeds: number;
//     tools: number;
//     total: number;
//   };
//   lowStock: {
//     animals: number;
//     pesticides: number;
//     equipment: number;
//     feeds: number;
//     fertilizers: number;
//     seeds: number;
//     tools: number;
//     total: number;
//   };
//   expiring: {
//     pesticides: number;
//     feeds: number;
//     fertilizers: number;
//     seeds: number;
//     harvests: number;
//     total: number;
//   };
// }

// function Stock() {
//   // State for active tab
//   const [activeTab, setActiveTab] = useState<string>('animals')
  
//   // State for stock data
//   const [stockData, setStockData] = useState<Record<string, StockItem[]>>({
//     animals: [],
//     pesticides: [],
//     equipment: [],
//     feeds: [],
//     fertilizers: [],
//     harvests: [],
//     seeds: [],
//     tools: []
//   })
  
//   // State for dashboard summary
//   const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  
//   // State for loading and errors
//   const [loading, setLoading] = useState<boolean>(false)
//   const [error, setError] = useState<string | null>(null)
  
//   // State for search
//   const [searchTerm, setSearchTerm] = useState<string>('')
  
//   // State for modal
//   const [showModal, setShowModal] = useState<boolean>(false)
//   const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
//   const [currentItem, setCurrentItem] = useState<StockItem | null>(null)
  
//   // Get authentication token from Redux store
//   const { accessToken } = useAppSelector(state => state.auth)
  
//   // Function to fetch data based on active tab
//   const fetchData = async () => {
//     if (!accessToken) return
    
//     setLoading(true)
//     setError(null)
    
//     try {
//       const data = await stockService.getAll(activeTab, accessToken)
//       setStockData(prev => ({
//         ...prev,
//         [activeTab]: data
//       }))
//     } catch (err: any) {
//       setError(err?.response?.data?.error || 'Failed to fetch data')
//     } finally {
//       setLoading(false)
//     }
//   }
  
//   // Function to fetch dashboard summary
//   const fetchDashboardSummary = async () => {
//     if (!accessToken) return
    
//     try {
//       const summary = await stockService.getDashboardSummary(accessToken)
//       setDashboardSummary(summary)
//     } catch (err: any) {
//       console.error('Failed to fetch dashboard summary', err)
//     }
//   }
  
//   // Fetch data when tab changes
//   useEffect(() => {
//     fetchData()
//   }, [activeTab, accessToken])
  
//   // Fetch dashboard summary on component mount
//   useEffect(() => {
//     fetchDashboardSummary()
//   }, [accessToken])
  
//   // Handle creating a new item
//   const handleCreate = () => {
//     setModalMode('create')
//     setCurrentItem(null)
//     setShowModal(true)
//   }
  
//   // Handle editing an item
//   const handleEdit = (item: StockItem) => {
//     setModalMode('edit')
//     setCurrentItem(item)
//     setShowModal(true)
//   }
  
//   // Handle deleting an item
//   const handleDelete = async (item: StockItem) => {
//     if (!accessToken || !item.id) return
    
//     if (!confirm('Are you sure you want to delete this item?')) return
    
//     setLoading(true)
    
//     try {
//       await stockService.delete(activeTab, item.id, accessToken)
      
//       // Refresh data
//       fetchData()
//       fetchDashboardSummary()
//     } catch (err: any) {
//       setError(err?.response?.data?.error || 'Failed to delete item')
//     } finally {
//       setLoading(false)
//     }
//   }
  
//   // Handle saving an item (create or edit)
//   const handleSave = async (formData: any) => {
//     if (!accessToken) return
    
//     setLoading(true)
    
//     try {
//       if (modalMode === 'create') {
//         await stockService.create(activeTab, formData, accessToken)
//       } else if (modalMode === 'edit' && currentItem?.id) {
//         await stockService.update(activeTab, currentItem.id, formData, accessToken)
//       }
      
//       // Close modal and refresh data
//       setShowModal(false)
//       fetchData()
//       fetchDashboardSummary()
//     } catch (err: any) {
//       setError(err?.response?.data?.error || `Failed to ${modalMode} item`)
//     } finally {
//       setLoading(false)
//     }
//   }
  
//   // Get the current data based on active tab
//   const getCurrentData = (): StockItem[] => {
//     return stockData[activeTab] || []
//   }
  
//   // Filter data based on search term
//   const getFilteredData = (): StockItem[] => {
//     const data = getCurrentData()
    
//     if (!searchTerm) return data
    
//     return data.filter(item => {
//       // Search in different fields based on stock type
//       const searchFields = [
//         item.name, 
//         item.type, 
//         item.cropName, 
//         item.status,
//         item.unit
//       ].filter(Boolean) // Remove undefined/null values
      
//       return searchFields.some(
//         field => field?.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     })
//   }
  
//   // Export data to CSV
//   const exportToCSV = () => {
//     const data = getFilteredData()
//     const headers = getTableHeaders()
    
//     // Create CSV content
//     let csvContent = headers.join(',') + '\n'
    
//     data.forEach(item => {
//       const row = headers.map(header => {
//         // Convert header to camelCase for object property access
//         const prop = header.toLowerCase().replace(/\s(.)/g, (_, char) => char.toUpperCase())
//         // @ts-ignore
//         return item[prop] !== undefined ? `"${item[prop]}"` : '""'
//       })
      
//       csvContent += row.join(',') + '\n'
//     })
    
//     // Create download link
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
//     const url = URL.createObjectURL(blob)
//     const link = document.createElement('a')
//     link.setAttribute('href', url)
//     link.setAttribute('download', `${activeTab}_${new Date().toISOString()}.csv`)
//     link.style.visibility = 'hidden'
//     document.body.appendChild(link)
//     link.click()
//     document.body.removeChild(link)
//   }
  
//   // Get table headers based on active tab
//   const getTableHeaders = (): string[] => {
//     const commonHeaders = ['ID', 'Name', 'Quantity', 'Price']
    
//     switch (activeTab) {
//       case 'animals':
//         return ['ID', 'Type', 'Count', 'Gender', 'Health Status']
//       case 'pesticides':
//         return [...commonHeaders, 'Type', 'Unit', 'Expiry Date']
//       case 'equipment':
//         return [...commonHeaders, 'Type', 'Status', 'Operational Status']
//       case 'feeds':
//         return [...commonHeaders, 'Animal Type', 'Unit', 'Expiry Date']
//       case 'fertilizers':
//         return [...commonHeaders, 'Type', 'Unit', 'Expiry Date']
//       case 'harvests':
//         return ['ID', 'Crop Name', 'Quantity', 'Unit', 'Quality', 'Harvest Date']
//       case 'seeds':
//         return [...commonHeaders, 'Crop Type', 'Unit', 'Expiry Date']
//       case 'tools':
//         return [...commonHeaders, 'Category', 'Status', 'Condition']
//       default:
//         return commonHeaders
//     }
//   }
  
//   // Render table rows based on active tab
//   const renderTableRows = () => {
//     const data = getFilteredData()
    
//     if (data.length === 0) {
//       return (
//         <tr>
//           <td colSpan={getTableHeaders().length + 1} className="text-center">
//             {loading ? 'Loading...' : 'No data available'}
//           </td>
//         </tr>
//       )
//     }
    
//     return data.map(item => {
//       switch (activeTab) {
//         case 'animals':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.type}</td>
//               <td>{item.count}</td>
//               <td>{item.gender || 'N/A'}</td>
//               <td>{item.healthStatus || 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'pesticides':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity} {item.unit}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.type}</td>
//               <td>{item.unit}</td>
//               <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'equipment':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.type}</td>
//               <td>{item.status}</td>
//               <td>{item.operationalStatus || 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'feeds':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity} {item.unit}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.animalType || 'N/A'}</td>
//               <td>{item.unit}</td>
//               <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'fertilizers':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity} {item.unit}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.type}</td>
//               <td>{item.unit}</td>
//               <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'harvests':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.cropName}</td>
//               <td>{item.quantity} {item.unit}</td>
//               <td>{item.unit}</td>
//               <td>{item.quality || 'N/A'}</td>
//               <td>{item.harvestDate ? new Date(item.harvestDate).toLocaleDateString() : 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'seeds':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity} {item.unit}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.cropType || 'N/A'}</td>
//               <td>{item.unit}</td>
//               <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         case 'tools':
//           return (
//             <tr key={item.id}>
//               <td>{item.id}</td>
//               <td>{item.name}</td>
//               <td>{item.quantity}</td>
//               <td>{item.price ? `$${item.price}` : 'N/A'}</td>
//               <td>{item.category || 'N/A'}</td>
//               <td>{item.status}</td>
//               <td>{item.condition || 'N/A'}</td>
//               <td className="text-end">
//                 <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
//                   <FaEdit />
//                 </Button>
//                 <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
//                   <FaTrash />
//                 </Button>
//               </td>
//             </tr>
//           )
//         default:
//           return null
//       }
//     })
//   }
  
//   // Render form fields for create/edit modal based on active tab
//   const renderFormFields = () => {
//     switch (activeTab) {
//       case 'animals':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Type</Form.Label>
//               <Form.Control 
//                 type="text" 
//                 defaultValue={currentItem?.type || ''} 
//                 name="type" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Count</Form.Label>
//               <Form.Control 
//                 type="number" 
//                 defaultValue={currentItem?.count || 0} 
//                 name="count" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Gender</Form.Label>
//               <Form.Select name="gender" defaultValue={currentItem?.gender || 'male'}>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//               </Form.Select>
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Health Status</Form.Label>
//               <Form.Select name="healthStatus" defaultValue={currentItem?.healthStatus || 'good'}>
//                 <option value="excellent">Excellent</option>
//                 <option value="good">Good</option>
//                 <option value="fair">Fair</option>
//                 <option value="poor">Poor</option>
//               </Form.Select>
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Feeding Schedule</Form.Label>
//               <Form.Control 
//                 type="text" 
//                 defaultValue={currentItem?.feedingSchedule || ''} 
//                 name="feedingSchedule" 
//                 required 
//               />
//             </Form.Group>
//           </>
//         )
      
//       case 'pesticides':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Name</Form.Label>
//               <Form.Control 
//                 type="text" 
//                 defaultValue={currentItem?.name || ''} 
//                 name="name" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Quantity</Form.Label>
//               <Form.Control 
//                 type="number" 
//                 defaultValue={currentItem?.quantity || 0} 
//                 name="quantity" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Unit</Form.Label>
//               <Form.Control 
//                 type="text" 
//                 defaultValue={currentItem?.unit || 'litres'} 
//                 name="unit" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Price</Form.Label>
//               <Form.Control 
//                 type="number" 
//                 defaultValue={currentItem?.price || 0} 
//                 name="price" 
//                 step="0.01" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Type</Form.Label>
//               <Form.Select name="type" defaultValue={currentItem?.type || 'insecticide'}>
//                 <option value="insecticide">Insecticide</option>
//                 <option value="herbicide">Herbicide</option>
//                 <option value="fungicide">Fungicide</option>
//                 <option value="other">Other</option>
//               </Form.Select>
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Minimum Quantity Alert</Form.Label>
//               <Form.Control 
//                 type="number" 
//                 defaultValue={currentItem?.minQuantityAlert || 10} 
//                 name="minQuantityAlert" 
//                 required 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Expiry Date</Form.Label>
//               <Form.Control 
//                 type="date" 
//                 defaultValue={currentItem?.expiryDate ? new Date(currentItem.expiryDate).toISOString().split('T')[0] : ''} 
//                 name="expiryDate" 
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Is Natural</Form.Label>
//               <Form.Check 
//                 type="checkbox" 
//                 defaultChecked={currentItem?.isNatural || false} 
//                 name="isNatural" 
//               />
//             </Form.Group>
//           </>
//         )
      
//       // Add other category form fields here
//       // For brevity, I'm only including animals and pesticides as examples
      
//       default:
//         return (
//           <p>Form fields for {activeTab} are not yet implemented.</p>
//         )
//     }
//   }

//   // Prepare data for stock distribution chart
//   const getStockDistributionData = () => {
//     if (!dashboardSummary) return null
    
//     return {
//       labels: ['Animals', 'Pesticides', 'Equipment', 'Feeds', 'Fertilizers', 'Harvests', 'Seeds', 'Tools'],
//       datasets: [
//         {
//           label: 'Stock Items',
//           data: [
//             dashboardSummary.totalItems.animals,
//             dashboardSummary.totalItems.pesticides,
//             dashboardSummary.totalItems.equipment,
//             dashboardSummary.totalItems.feeds,
//             dashboardSummary.totalItems.fertilizers,
//             dashboardSummary.totalItems.harvests,
//             dashboardSummary.totalItems.seeds,
//             dashboardSummary.totalItems.tools
//           ],
//           backgroundColor: [
//             'rgba(255, 99, 132, 0.6)',
//             'rgba(54, 162, 235, 0.6)',
//             'rgba(255, 206, 86, 0.6)',
//             'rgba(75, 192, 192, 0.6)',
//             'rgba(153, 102, 255, 0.6)',
//             'rgba(255, 159, 64, 0.6)',
//             'rgba(199, 199, 199, 0.6)',
//             'rgba(83, 102, 255, 0.6)'
//           ],
//           borderWidth: 1
//         }
//       ]
//     }
//   }

//   // Prepare data for value distribution chart
//   const getValueDistributionData = () => {
//     if (!dashboardSummary) return null
    
//     return {
//       labels: ['Animals', 'Pesticides', 'Equipment', 'Feeds', 'Fertilizers', 'Harvests', 'Seeds', 'Tools'],
//       datasets: [
//         {
//           label: 'Stock Value ($)',
//           data: [
//             dashboardSummary.totalValue.animals,
//             dashboardSummary.totalValue.pesticides,
//             dashboardSummary.totalValue.equipment,
//             dashboardSummary.totalValue.feeds,
//             dashboardSummary.totalValue.fertilizers,
//             dashboardSummary.totalValue.harvests,
//             dashboardSummary.totalValue.seeds,
//             dashboardSummary.totalValue.tools
//           ],
//           backgroundColor: 'rgba(75, 192, 192, 0.6)',
//           borderColor: 'rgba(75, 192, 192, 1)',
//           borderWidth: 1
//         }
//       ]
//     }
//   }
  
//   return (
//     <div className="container-fluid">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h1 className="mb-0 text-2xl font-bold text-[#1A2F2B]">Stock Management</h1>
//         <div>
//           <Button 
//             variant="success" 
//             className="me-2" 
//             onClick={handleCreate}
//           >
//             <FaPlus className="me-1" /> Add Item
//           </Button>
//           <Button 
//             variant="outline-secondary" 
//             onClick={exportToCSV}
//           >
//             <FaDownload className="me-1" /> Export
//           </Button>
//         </div>
//       </div>
      
//       {error && (
//         <Alert variant="danger" dismissible onClose={() => setError(null)}>
//           {error}
//         </Alert>
//       )}
      
//       {/* Dashboard Summary */}
//       <div className="row mb-4">
//         <div className="col-md-3">
//           <Card className="bg-primary text-white h-100">
//             <Card.Body>
//               <Card.Title>Total Stock Items</Card.Title>
//               <h2 className="display-4">{dashboardSummary?.totalItems.total || 0}</h2>
//               <Card.Text>Across all categories</Card.Text>
//             </Card.Body>
//           </Card>
//         </div>
        
//         <div className="col-md-3">
//           <Card className="bg-success text-white h-100">
//             <Card.Body>
//               <Card.Title>Total Inventory Value</Card.Title>
//               <h2 className="display-4">${dashboardSummary?.totalValue.total.toFixed(2) || '0.00'}</h2>
//               <Card.Text>Combined value of all inventory</Card.Text>
//             </Card.Body>
//           </Card>
//         </div>
        
//         <div className="col-md-3">
//           <Card className="bg-warning text-dark h-100">
//             <Card.Body>
//               <Card.Title>
//                 <FaExclamationTriangle className="me-2" />
//                 Low Stock Items
//               </Card.Title>
//               <h2 className="display-4">{dashboardSummary?.lowStock.total || 0}</h2>
//               <Card.Text>Items below minimum threshold</Card.Text>
//             </Card.Body>
//           </Card>
//         </div>
        
//         <div className="col-md-3">
//           <Card className="bg-danger text-white h-100">
//             <Card.Body>
//               <Card.Title>
//                 <FaCalendarAlt className="me-2" />
//                 Expiring Soon
//               </Card.Title>
//               <h2 className="display-4">{dashboardSummary?.expiring.total || 0}</h2>
//               <Card.Text>Items expiring within 30 days</Card.Text>
//             </Card.Body>
//           </Card>
//         </div>
//       </div>
      
//       {/* Charts */}
//       {dashboardSummary && (
//         <Row className="mb-4">
//           <Col md={6}>
//             <Card>
//               <Card.Body>
//                 <Card.Title>Stock Distribution</Card.Title>
//                 <div style={{ height: '300px' }}>
//                   <Pie data={getStockDistributionData() as any} options={{ maintainAspectRatio: false }} />
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>
          
//           <Col md={6}>
//             <Card>
//               <Card.Body>
//                 <Card.Title>Value Distribution ($)</Card.Title>
//                 <div style={{ height: '300px' }}>
//                   <Bar 
//                     data={getValueDistributionData() as any} 
//                     options={{ 
//                       maintainAspectRatio: false,
//                       scales: {
//                         y: {
//                           beginAtZero: true
//                         }
//                       }
//                     }} 
//                   />
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       )}
      
//       <div className="bg-white rounded-xl shadow-md p-4">
//         <Tabs
//           activeKey={activeTab}
//           onSelect={(k) => k && setActiveTab(k)}
//           className="mb-4"
//         >
//           <Tab eventKey="animals" title="Animals" />
//           <Tab eventKey="pesticides" title="Pesticides" />
//           <Tab eventKey="equipment" title="Equipment" />
//           <Tab eventKey="feeds" title="Feeds" />
//           <Tab eventKey="fertilizers" title="Fertilizers" />
//           <Tab eventKey="harvests" title="Harvests" />
//           <Tab eventKey="seeds" title="Seeds" />
//           <Tab eventKey="tools" title="Tools" />
//         </Tabs>
        
//         <div className="mb-3 d-flex justify-content-end">
//           <div className="input-group" style={{ maxWidth: '300px' }}>
//             <span className="input-group-text">
//               <FaSearch />
//             </span>
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Search..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//         </div>
        
//         <div className="table-responsive">
//           <table className="table table-striped table-hover">
//             <thead>
//               <tr>
//                 {getTableHeaders().map((header, index) => (
//                   <th key={index}>{header}</th>
//                 ))}
//                 <th className="text-end">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={getTableHeaders().length + 1} className="text-center py-4">
//                     <Spinner animation="border" role="status">
//                       <span className="visually-hidden">Loading...</span>
//                     </Spinner>
//                   </td>
//                 </tr>
//               ) : (
//                 renderTableRows()
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
      
//       {/* Create/Edit Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>
//             {modalMode === 'create' ? 'Add New' : 'Edit'} {activeTab.slice(0, -1)}
//           </Modal.Title>
//         </Modal.Header>
//         <Form onSubmit={(e) => {
//           e.preventDefault()
//           const formData = Object.fromEntries(new FormData(e.target as HTMLFormElement))
//           handleSave(formData)
//         }}>
//           <Modal.Body>
//             {renderFormFields()}
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="secondary" onClick={() => setShowModal(false)}>
//               Cancel
//             </Button>
//             <Button variant="primary" type="submit" disabled={loading}>
//               {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     </div>
//   )
// }

// export default Stock

