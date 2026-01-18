<script setup lang="ts">
/**
 * Table Component
 * A simple data table with mock data
 */

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Data Table"
});

// Mock data
const tableData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Pending" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Active" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Inactive" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "Active" }
];

const getStatusClass = (status: string) => {
  return {
    active: status === "Active",
    pending: status === "Pending",
    inactive: status === "Inactive"
  };
};
</script>

<template>
  <div class="table-container">
    <div class="table-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="table-body">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.email }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(row.status)">
                {{ row.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  box-sizing: border-box;
}

.table-header {
  background: #2c3e50;
  color: white;
  padding: 12px 16px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.table-body {
  flex: 1;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

tr:hover {
  background: #f5f5f5;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}
</style>
