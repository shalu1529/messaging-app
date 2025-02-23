import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const history = useHistory();

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data.filter(user => user.id !== currentUser.id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      await axios.post('http://localhost:5000/api/messages', {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    history.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Messaging App</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {currentUser.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex">
          <div className="w-1/4 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map(user => (
                <li
                  key={user.id}
                  className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  {user.name} ({user.role})
                </li>
              ))}
            </ul>
          </div>
          <div className="w-3/4 ml-6">
            {selectedUser ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chat with {selectedUser.name}
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4 h-64 overflow-y-auto">
                    {messages
                      .filter(msg => 
                        (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
                        (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
                      )
                      .map(message => (
                        <div
                          key={message.id}
                          className={`p-2 rounded-lg ${
                            message.sender_id === currentUser.id
                              ? 'bg-blue-100 ml-auto'
                              : 'bg-gray-100'
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-4">
                    <div className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-grow rounded-l-md border-t mr-0 border-b border-l text-gray-800 border-gray-200 bg-white px-4 py-2"
                        placeholder="Type your message..."
                      />
                      <button
                        type="submit"
                        className="px-4 rounded-r-md bg-blue-500 text-white font-semibold p-2 uppercase border-blue-500 border-t border-b border-r"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Select a user to start chatting
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;