import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical,
  FiShield,
  FiUser,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', {
        params: { page, limit: 20, search, role: selectedRole }
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`/api/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge admin"><FiShield /> Админ</span>;
      case 'moderator':
        return <span className="badge moderator"><FiUser /> Модератор</span>;
      default:
        return <span className="badge user">Пользователь</span>;
    }
  };

  const getStatusBadge = (status) => {
    return status === 'online' 
      ? <span className="badge online">Онлайн</span>
      : <span className="badge offline">Офлайн</span>;
  };

  return (
    <div className="admin-users">
      <div className="admin-card-header">
        <h2>Управление пользователями</h2>
        <div className="header-actions">
          <div className="search-wrapper">
            <FiSearch />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-filter"
          >
            <option value="">Все роли</option>
            <option value="admin">Админы</option>
            <option value="moderator">Модераторы</option>
            <option value="user">Пользователи</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <motion.tr 
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td>
                    <div className="user-cell">
                      <img src={user.avatar || '/default-avatar.svg'} alt="" />
                      <div className="user-info">
                        <span className="name">{user.firstName} {user.lastName}</span>
                        <span className="username">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="role-select"
                    >
                      <option value="user">Пользователь</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className="actions">
                      <button className="icon-button" title="Редактировать">
                        <FiEdit2 />
                      </button>
                      <button 
                        className="icon-button danger"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Удалить"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              <p>Пользователи не найдены</p>
            </div>
          )}

          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <FiChevronLeft />
            </button>
            <span className="page-info">
              Страница {page} из {totalPages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;