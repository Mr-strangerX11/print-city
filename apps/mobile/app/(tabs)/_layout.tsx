import { Tabs } from 'expo-router';
import { Home, Search, ShoppingBag, User } from 'lucide-react-native';
import { View, Text } from 'react-native';

function TabIcon({ icon: Icon, focused, label }: { icon: any; focused: boolean; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Icon size={22} color={focused ? '#7C3AED' : '#9CA3AF'} />
      <Text style={{ fontSize: 10, color: focused ? '#7C3AED' : '#9CA3AF', fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} label="Home" /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Search} focused={focused} label="Explore" /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={ShoppingBag} focused={focused} label="Cart" /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} label="Account" /> }}
      />
    </Tabs>
  );
}
