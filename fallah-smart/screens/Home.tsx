import DonationCampaign from "./DonationCampaign";
import StockDashboard from "./StockDashboard";
import Wallet from "./Wallet";
import WeatherScreen from "./weather/WeatherScreen";

import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

const HomeScreen = () => {
  // Implementation of HomeScreen component
};

const App = () => {
  return (
    <Drawer.Navigator 
      initialRouteName="Home" 
      screenOptions={{ 
        drawerLabelStyle: { color: '#093731' }, 
        drawerActiveBackgroundColor: '#EBF3EB', 
        drawerActiveTintColor: '#093731',
        drawerItemStyle: { borderRadius: 10 },
        headerStyle: { 
          backgroundColor: '#093731',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Drawer.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ 
          drawerIcon: ({focused, color, size}) => <MaterialIcons name="home" size={size} color={color} />,
          drawerLabel: "الرئيسية",
          headerTitle: "الرئيسية"
        }}
      />
      <Drawer.Screen 
        name="Wallet" 
        component={Wallet}
        options={{ 
          drawerIcon: ({focused, color, size}) => <MaterialIcons name="account-balance-wallet" size={size} color={color} />,
          drawerLabel: "المحفظة",
          headerTitle: "المحفظة"
        }}
      />
      <Drawer.Screen 
        name="StockDashboard" 
        component={StockDashboard}
        options={{ 
          drawerIcon: ({focused, color, size}) => <MaterialIcons name="trending-up" size={size} color={color} />,
          drawerLabel: "البورصة",
          headerTitle: "البورصة"
        }}
      />
      <Drawer.Screen 
        name="Weather" 
        component={WeatherScreen}
        options={{ 
          drawerIcon: ({focused, color, size}) => <MaterialIcons name="wb-sunny" size={size} color={color} />,
          drawerLabel: "الطقس والزراعة",
          headerTitle: "الطقس والزراعة"
        }}
      />
      <Drawer.Screen 
        name="DonationCampaign" 
        component={DonationCampaign}
        options={{ 
          drawerIcon: ({focused, color, size}) => <MaterialIcons name="favorite" size={size} color={color} />,
          drawerLabel: "حملات التبرع",
          headerTitle: "حملات التبرع"
        }}
      />
    </Drawer.Navigator>
  );
};

export default App; 