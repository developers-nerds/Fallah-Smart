import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Pets as PetsIcon,
  Science as ScienceIcon,
  Agriculture as AgricultureIcon,
  LocalFlorist as FloristIcon,
  Grass as GrassIcon,
  EmojiNature as NatureIcon,
  Build as BuildIcon,
  Spa as SpaIcon,
  Warning as WarningIcon,
  HourglassEmpty as ExpireIcon,
  BarChart as ChartIcon,
  Home as HomeIcon,
  MonetizationOn as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API || 'http://localhost:5000/api';

interface DashboardSummary {
  totalItems: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    harvests: number;
    seeds: number;
    tools: number;
    total: number;
  };
  totalValue: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    harvests: number;
    seeds: number;
    tools: number;
    total: number;
  };
  lowStock: {
    animals: number;
    pesticides: number;
    equipment: number;
    feeds: number;
    fertilizers: number;
    seeds: number;
    tools: number;
    total: number;
  };
  expiring: {
    pesticides: number;
    feeds: number;
    fertilizers: number;
    seeds: number;
    harvests: number;
    total: number;
  };
}

interface UserStock {
  user: {
    id: number;
    name: string;
    email: string;
    username: string;
    role: string;
    profilePicture: string;
  };
  stockStats: {
    totalItems: number;
    animalCount: number;
    pesticideCount: number;
    equipmentCount: number;
    feedCount: number;
    fertilizerCount: number;
    harvestCount: number;
    seedCount: number;
    toolCount: number;
  };
}

// Farm-themed colors
const FARM_COLORS = [
  '#4F7942', // Green
  '#8FBC8F', // Dark Sea Green
  '#2E8B57', // Sea Green
  '#3CB371', // Medium Sea Green
  '#90EE90', // Light Green
  '#006400', // Dark Green
  '#556B2F', // Olive Green
  '#093731', // Primary Dark Green
];

const StockDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [usersData, setUsersData] = useState<UserStock[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<number | string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDashboardData = async (userId?: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const url = userId && userId !== 'all' 
        ? `/stock-dashboard/summary?userId=${userId}`
        : `/stock-dashboard/summary`;

      const response = await api.get(url);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithStockStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/stock-dashboard/users-stats`);
      setUsersData(response.data);
    } catch (err: any) {
      console.error('Error fetching users data:', err);
      setError(err.response?.data?.error || 'Failed to fetch users data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUsersWithStockStats();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserChange = (event: SelectChangeEvent<string | number>) => {
    const userId = event.target.value;
    setSelectedUser(userId);
    fetchDashboardData(userId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(selectedUser);
    await fetchUsersWithStockStats();
    setRefreshing(false);
  };

  const getStockDistributionData = () => {
    if (!dashboardData) return [];

    return [
      { name: 'Animals', value: dashboardData.totalItems.animals, icon: <PetsIcon /> },
      { name: 'Pesticides', value: dashboardData.totalItems.pesticides, icon: <ScienceIcon /> },
      { name: 'Equipment', value: dashboardData.totalItems.equipment, icon: <AgricultureIcon /> },
      { name: 'Feeds', value: dashboardData.totalItems.feeds, icon: <GrassIcon /> },
      { name: 'Fertilizers', value: dashboardData.totalItems.fertilizers, icon: <FloristIcon /> },
      { name: 'Harvests', value: dashboardData.totalItems.harvests, icon: <NatureIcon /> },
      { name: 'Seeds', value: dashboardData.totalItems.seeds, icon: <SpaIcon /> },
      { name: 'Tools', value: dashboardData.totalItems.tools, icon: <BuildIcon /> },
    ].filter(item => item.value > 0);
  };

  const getValueDistributionData = () => {
    if (!dashboardData) return [];

    return [
      { name: 'Pesticides', value: dashboardData.totalValue.pesticides },
      { name: 'Equipment', value: dashboardData.totalValue.equipment },
      { name: 'Feeds', value: dashboardData.totalValue.feeds },
      { name: 'Fertilizers', value: dashboardData.totalValue.fertilizers },
      { name: 'Harvests', value: dashboardData.totalValue.harvests },
      { name: 'Seeds', value: dashboardData.totalValue.seeds },
      { name: 'Tools', value: dashboardData.totalValue.tools },
    ].filter(item => item.value > 0);
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        backgroundColor: '#f5f8f4'
      }}>
        <CircularProgress sx={{ color: '#093731' }} />
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        backgroundColor: '#f5f8f4',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => fetchDashboardData()} 
          sx={{ 
            mt: 2,
            backgroundColor: '#093731',
            '&:hover': {
              backgroundColor: '#0b4e43'
            }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#f5f8f4',
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap', 
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ 
            color: '#093731',
            fontWeight: 600,
            mr: 2
          }}>
            Stock Dashboard
          </Typography>
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ 
              color: '#4F7942',
              backgroundColor: 'rgba(79, 121, 66, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(79, 121, 66, 0.2)',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <FormControl sx={{ 
          minWidth: 200,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(9, 55, 49, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(9, 55, 49, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#093731',
            },
          },
        }}>
          <InputLabel id="user-select-label">User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            value={selectedUser}
            label="User"
            onChange={handleUserChange}
          >
            <MenuItem value="all">All Users</MenuItem>
            {usersData.map((userData) => (
              <MenuItem key={userData.user.id} value={userData.user.id}>
                {userData.user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            color: 'rgba(9, 55, 49, 0.7)',
            '&.Mui-selected': {
              color: '#093731',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#093731',
          },
          backgroundColor: 'white',
          borderRadius: 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          p: 1
        }}
      >
        <Tab icon={<HomeIcon />} label="DASHBOARD" />
        <Tab icon={<PeopleIcon />} label="USERS" />
        <Tab icon={<ChartIcon />} label="STATISTICS" />
      </Tabs>

      {tabValue === 0 && dashboardData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
                background: 'linear-gradient(to bottom right, #E8F5F3, white)'
              }}>
                <CardContent sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#093731',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <BuildIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 1 }}>
                    Total Items
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#093731', fontWeight: 700 }}>
                    {dashboardData.totalItems.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                    Across all stock categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
                background: 'linear-gradient(to bottom right, #F5F6E8, white)'
              }}>
                <CardContent sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#4F7942',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <MoneyIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 1 }}>
                    Total Value
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#4F7942', fontWeight: 700 }}>
                    ${dashboardData.totalValue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                    Estimated inventory value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
                background: 'linear-gradient(to bottom right, #FFF8E1, white)'
              }}>
                <CardContent sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#ED6C02',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <WarningIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 1 }}>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#ED6C02', fontWeight: 700 }}>
                    {dashboardData.lowStock.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                    Items below minimum threshold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
                background: 'linear-gradient(to bottom right, #FBE9E7, white)'
              }}>
                <CardContent sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#D32F2F',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <ExpireIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 1 }}>
                    Expiring Items
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#D32F2F', fontWeight: 700 }}>
                    {dashboardData.expiring.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                    Items expiring within 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%',
                overflow: 'hidden'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 2 }}>
                    Stock Distribution
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStockDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          innerRadius={30}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {getStockDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={FARM_COLORS[index % FARM_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Items']} 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600, mb: 2 }}>
                    Value Distribution
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getValueDistributionData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#4F7942" name="Value ($)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                mt: 3
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ color: '#ED6C02', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600 }}>
                      Low Stock Items
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      boxShadow: 'none',
                      borderRadius: 2,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#888',
                        borderRadius: '4px',
                      },
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f8f4' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Category</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(dashboardData.lowStock)
                          .filter(([key, value]) => key !== 'total' && value > 0)
                          .map(([key, value]) => (
                            <TableRow key={key} sx={{ 
                              '&:hover': { backgroundColor: '#f5f8f4' },
                              transition: 'background-color 0.2s'
                            }}>
                              <TableCell>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                              <TableCell align="right" sx={{ 
                                color: value > 10 ? '#ED6C02' : '#D32F2F',
                                fontWeight: 500
                              }}>
                                {value}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                mt: 3
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExpireIcon sx={{ color: '#D32F2F', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600 }}>
                      Expiring Items
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      boxShadow: 'none',
                      borderRadius: 2,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#888',
                        borderRadius: '4px',
                      },
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f8f4' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Category</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(dashboardData.expiring)
                          .filter(([key, value]) => key !== 'total' && value > 0)
                          .map(([key, value]) => (
                            <TableRow key={key} sx={{ 
                              '&:hover': { backgroundColor: '#f5f8f4' },
                              transition: 'background-color 0.2s'
                            }}>
                              <TableCell>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                              <TableCell align="right" sx={{ 
                                color: '#D32F2F',
                                fontWeight: 500
                              }}>
                                {value}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: '#f5f8f4' }}>
            <PeopleIcon sx={{ color: '#093731', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600 }}>
              User Inventory Management
            </Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f8f4' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Email</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Total Items</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Animals</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Pesticides</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Equipment</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Feeds</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Fertilizers</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Harvests</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Seeds</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Tools</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1A2F2B' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersData.map((userData) => (
                  <TableRow key={userData.user.id} sx={{ 
                    '&:hover': { backgroundColor: '#f5f8f4' },
                    transition: 'background-color 0.2s'
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={userData.user.profilePicture} 
                          alt={userData.user.name}
                          sx={{ 
                            mr: 2,
                            border: '2px solid #4F7942'
                          }}
                        />
                        <Typography sx={{ fontWeight: 500, color: '#1A2F2B' }}>
                          {userData.user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{userData.user.email}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#093731' }}>{userData.stockStats.totalItems}</TableCell>
                    <TableCell align="right">{userData.stockStats.animalCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.pesticideCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.equipmentCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.feedCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.fertilizerCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.harvestCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.seedCount}</TableCell>
                    <TableCell align="right">{userData.stockStats.toolCount}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={() => {
                          setSelectedUser(userData.user.id);
                          fetchDashboardData(userData.user.id);
                          setTabValue(0);
                        }}
                        sx={{
                          backgroundColor: '#093731',
                          '&:hover': {
                            backgroundColor: '#0b4e43'
                          },
                          borderRadius: 4,
                          boxShadow: 'none',
                          textTransform: 'none'
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabValue === 2 && dashboardData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <Box sx={{ p: 2, backgroundColor: '#f5f8f4', display: 'flex', alignItems: 'center' }}>
                <ChartIcon sx={{ color: '#093731', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#1A2F2B', fontWeight: 600 }}>
                  Category Breakdown
                </Typography>
              </Box>
              <Divider />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Animals', items: dashboardData.totalItems.animals, value: dashboardData.totalValue.animals },
                        { name: 'Pesticides', items: dashboardData.totalItems.pesticides, value: dashboardData.totalValue.pesticides },
                        { name: 'Equipment', items: dashboardData.totalItems.equipment, value: dashboardData.totalValue.equipment },
                        { name: 'Feeds', items: dashboardData.totalItems.feeds, value: dashboardData.totalValue.feeds },
                        { name: 'Fertilizers', items: dashboardData.totalItems.fertilizers, value: dashboardData.totalValue.fertilizers },
                        { name: 'Harvests', items: dashboardData.totalItems.harvests, value: dashboardData.totalValue.harvests },
                        { name: 'Seeds', items: dashboardData.totalItems.seeds, value: dashboardData.totalValue.seeds },
                        { name: 'Tools', items: dashboardData.totalItems.tools, value: dashboardData.totalValue.tools },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#4F7942" />
                      <YAxis yAxisId="right" orientation="right" stroke="#093731" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: 'none'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="items" fill="#4F7942" name="Number of Items" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="value" fill="#093731" name="Value ($)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StockDashboard; 