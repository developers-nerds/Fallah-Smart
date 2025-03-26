import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';
import { FaExclamationTriangle, FaCalendarAlt, FaTools, FaTimesCircle, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import stockService, { StockItem } from '../services/stockService';
import { useAppSelector } from '../redux/store';
import { StockAlert, getStockAlerts } from '../utils/stockUtils';

interface StockAlertsProps {
  compact?: boolean;
  maxAlerts?: number;
}

const StockAlerts: React.FC<StockAlertsProps> = ({ compact = false, maxAlerts = 5 }) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stockData, setStockData] = useState<Record<string, StockItem[]>>({});
  
  const { accessToken } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    if (!accessToken) return;
    
    const fetchStockData = async () => {
      setLoading(true);
      try {
        const categories = ['animals', 'pesticides', 'equipment', 'feeds', 'fertilizers', 'harvests', 'seeds', 'tools'];
        const stockItems: Record<string, StockItem[]> = {};
        
        // Fetch data for each category
        await Promise.all(
          categories.map(async (category) => {
            try {
              const items = await stockService.getAll(category, accessToken);
              stockItems[category] = items;
            } catch (error) {
              console.error(`Error fetching ${category}:`, error);
              stockItems[category] = [];
            }
          })
        );
        
        setStockData(stockItems);
        const generatedAlerts = getStockAlerts(stockItems);
        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Error fetching stock data for alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
  }, [accessToken]);
  
  // Get alert icon based on alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <FaExclamationTriangle className="text-warning" />;
      case 'expiring_soon':
        return <FaCalendarAlt className="text-warning" />;
      case 'expired':
        return <FaTimesCircle className="text-danger" />;
      case 'maintenance_due':
        return <FaTools className="text-primary" />;
      default:
        return <FaBell />;
    }
  };
  
  // Get alert badge color based on type
  const getAlertBadgeColor = (type: string): string => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'expiring_soon':
        return 'warning';
      case 'expired':
        return 'danger';
      case 'maintenance_due':
        return 'primary';
      default:
        return 'secondary';
    }
  };
  
  // Get alert badge text
  const getAlertBadgeText = (type: string): string => {
    switch (type) {
      case 'low_stock':
        return 'Low Stock';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'maintenance_due':
        return 'Maintenance Due';
      default:
        return 'Alert';
    }
  };
  
  // Render compact version
  if (compact) {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaBell className="me-2" /> Stock Alerts
          </h5>
          <Badge bg="danger" pill>
            {alerts.length}
          </Badge>
        </Card.Header>
        
        <ListGroup variant="flush">
          {loading ? (
            <ListGroup.Item>Loading alerts...</ListGroup.Item>
          ) : alerts.length === 0 ? (
            <ListGroup.Item className="text-center text-success">
              No alerts found. All stock items are in good condition.
            </ListGroup.Item>
          ) : (
            alerts
              .slice(0, maxAlerts)
              .map((alert, index) => (
                <ListGroup.Item key={index} className="d-flex align-items-center">
                  <div className="me-3">{getAlertIcon(alert.type)}</div>
                  <div>
                    <div className="d-flex align-items-center">
                      <Badge bg={getAlertBadgeColor(alert.type)} className="me-2">
                        {getAlertBadgeText(alert.type)}
                      </Badge>
                      <span className="fw-bold">{alert.item.name || alert.item.type || 'Unknown Item'}</span>
                    </div>
                    <small className="text-muted">{alert.message}</small>
                  </div>
                </ListGroup.Item>
              ))
          )}
        </ListGroup>
        
        {alerts.length > maxAlerts && (
          <Card.Footer className="text-center">
            <Link to="/stock" className="btn btn-sm btn-outline-primary">
              View All Alerts ({alerts.length})
            </Link>
          </Card.Footer>
        )}
      </Card>
    );
  }
  
  // Render full version
  return (
    <Card className="mb-4">
      <Card.Header className="bg-danger text-white">
        <h5 className="mb-0">
          <FaBell className="me-2" /> Stock Alerts and Notifications
        </h5>
      </Card.Header>
      
      <Card.Body>
        {loading ? (
          <p className="text-center">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-success mb-3" style={{ fontSize: '3rem' }}>
              <FaBell />
            </div>
            <h4>No Alerts Found</h4>
            <p className="text-muted">All stock items are in good condition.</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <h6 className="text-muted">Summary</h6>
              <div className="d-flex gap-2 flex-wrap">
                <Badge bg="warning" className="py-2 px-3">
                  Low Stock: {alerts.filter(a => a.type === 'low_stock').length}
                </Badge>
                <Badge bg="warning" className="py-2 px-3">
                  Expiring Soon: {alerts.filter(a => a.type === 'expiring_soon').length}
                </Badge>
                <Badge bg="danger" className="py-2 px-3">
                  Expired: {alerts.filter(a => a.type === 'expired').length}
                </Badge>
                <Badge bg="primary" className="py-2 px-3">
                  Maintenance Due: {alerts.filter(a => a.type === 'maintenance_due').length}
                </Badge>
              </div>
            </div>
            
            <ListGroup>
              {alerts.map((alert, index) => (
                <ListGroup.Item 
                  key={index} 
                  className="d-flex align-items-start"
                  action
                >
                  <div className="me-3 mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="mb-0 d-flex align-items-center">
                        <Badge bg={getAlertBadgeColor(alert.type)} className="me-2">
                          {getAlertBadgeText(alert.type)}
                        </Badge>
                        {alert.item.name || alert.item.type || 'Unknown Item'}
                      </h6>
                      <small className="text-muted">
                        Category: {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                      </small>
                    </div>
                    <p className="mb-1">{alert.message}</p>
                    
                    {alert.type === 'low_stock' && (
                      <small className="text-muted">
                        Current: {alert.item.quantity || alert.item.count || 0} {alert.item.unit || ''}
                        {alert.item.minQuantityAlert !== undefined && (
                          <span> | Min: {alert.item.minQuantityAlert} {alert.item.unit || ''}</span>
                        )}
                      </small>
                    )}
                    
                    {(alert.type === 'expiring_soon' || alert.type === 'expired') && alert.item.expiryDate && (
                      <small className="text-muted">
                        Expiry Date: {new Date(alert.item.expiryDate).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                  <div className="ms-2">
                    <Link 
                      to={`/stock?tab=${alert.category}&id=${alert.item.id}`} 
                      className="btn btn-sm btn-outline-primary"
                    >
                      View
                    </Link>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Card.Body>
      
      <Card.Footer>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">Last updated: {new Date().toLocaleString()}</small>
          <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default StockAlerts; 