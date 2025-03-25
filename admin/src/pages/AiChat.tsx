import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

function AiChat() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for data
  const [conversationData, setConversationData] = useState([]);
  const [tokenData, setTokenData] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        // Set authorization header
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // Fetch conversation statistics
        const conversationResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/conversations/admin/stats`,
          config
        );
        // Fetch message statistics
        const messageResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/messages/stats/admin`,
          config
        );
        // Update state with real data
        if (conversationResponse.data.success && messageResponse.data.success) {
          setConversationData(
            conversationResponse.data.data.dailyConversations
          );

          const tokenUsage = messageResponse.data.data.tokenUsage;
          setTokenData([
            { name: "Used", value: tokenUsage.used, color: "#FF9370" },
            {
              name: "Remaining",
              value: tokenUsage.remaining,
              color: "#65D3B4",
            },
          ]);

          setRecentConversations(messageResponse.data.data.recentConversations);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-[#1A2F2B]">
        AI Chat Dashboard
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Daily Conversations</span>
                  <Badge
                    variant="outline"
                    className="bg-[#FDF0F3] text-[#1A2F2B]"
                  >
                    This Week
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={conversationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversations" fill="#65D3B4" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={tokenData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {tokenData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-center">
                      <p className="text-2xl font-bold text-[#1A2F2B]">
                        {(
                          tokenData.find((item) => item.name === "Remaining")
                            ?.value || 0
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Tokens Remaining</p>
                    </div>
                    <div className="mt-4 flex gap-4 justify-center">
                      {tokenData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p>Loading data...</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#F5F5F5]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#1A2F2B]">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#1A2F2B]">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#1A2F2B]">
                          Messages
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#1A2F2B]">
                          Tokens
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentConversations.map((convo) => (
                        <tr
                          key={convo.id}
                          className="border-b hover:bg-[#FDF0F3]/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{convo.user}</td>
                          <td className="px-4 py-3 text-sm">{convo.time}</td>
                          <td className="px-4 py-3 text-sm">
                            {convo.messages/2}
                          </td>
                          <td className="px-4 py-3 text-sm">{convo.tokens/2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="conversations"
          className="rounded-xl bg-white p-4 shadow-md"
        >
          <h2 className="text-xl font-semibold text-[#1A2F2B]">
            Conversation History
          </h2>
          <div className="mt-4 h-64 rounded-lg bg-[#FDF0F3] p-4">
            <p className="text-center text-gray-500 mt-20">
              Select a conversation to view details
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default AiChat;
