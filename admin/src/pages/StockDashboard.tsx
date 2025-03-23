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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const StockDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [usersData, setUsersData] = useState<UserStock[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<number | string>('all');

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button variant="contained" onClick={() => fetchDashboardData()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Stock Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
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

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<HomeIcon />} label="DASHBOARD" />
        <Tab icon={<PeopleIcon />} label="USERS" />
        <Tab icon={<ChartIcon />} label="STATISTICS" />
      </Tabs>

      {tabValue === 0 && dashboardData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Items</Typography>
                  <Typography variant="h3">{dashboardData.totalItems.total.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Across all stock categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Value</Typography>
                  <Typography variant="h3">${dashboardData.totalValue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Estimated inventory value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Low Stock Items</Typography>
                  <Typography variant="h3">{dashboardData.lowStock.total.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Items below minimum threshold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Expiring Items</Typography>
                  <Typography variant="h3">{dashboardData.expiring.total.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Items expiring within 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Stock Distribution</Typography>
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
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getStockDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Items']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Value Distribution</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getValueDistributionData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" name="Value ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Low Stock Items
                    <WarningIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(dashboardData.lowStock)
                          .filter(([key, value]) => key !== 'total' && value > 0)
                          .map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                              <TableCell align="right">{value}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Expiring Items
                    <ExpireIcon color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(dashboardData.expiring)
                          .filter(([key, value]) => key !== 'total' && value > 0)
                          .map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                              <TableCell align="right">{value}</TableCell>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Total Items</TableCell>
                <TableCell align="right">Animals</TableCell>
                <TableCell align="right">Pesticides</TableCell>
                <TableCell align="right">Equipment</TableCell>
                <TableCell align="right">Feeds</TableCell>
                <TableCell align="right">Fertilizers</TableCell>
                <TableCell align="right">Harvests</TableCell>
                <TableCell align="right">Seeds</TableCell>
                <TableCell align="right">Tools</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersData.map((userData) => (
                <TableRow key={userData.user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={userData.user.profilePicture} 
                        alt={userData.user.name}
                        sx={{ mr: 2 }}
                      />
                      {userData.user.name}
                    </Box>
                  </TableCell>
                  <TableCell>{userData.user.email}</TableCell>
                  <TableCell align="right">{userData.stockStats.totalItems}</TableCell>
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
                      variant="outlined"
                      onClick={() => {
                        setSelectedUser(userData.user.id);
                        fetchDashboardData(userData.user.id);
                        setTabValue(0);
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
      )}

      {tabValue === 2 && dashboardData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
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
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="items" fill="#8884d8" name="Number of Items" />
                      <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Value ($)" />
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