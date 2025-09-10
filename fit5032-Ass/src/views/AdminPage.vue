<template>
  <div class="container py-5">
    <h2 class="mb-4">Admin Dashboard</h2>
    <p class="text-muted">Only users with role <code>admin</code> can see this page.</p>
    <div class="alert alert-info">
      <div>Signed in as: <strong>{{ session?.email }}</strong></div>
      <div>Role: <strong>{{ session?.role }}</strong></div>
    </div>
  </div>
</template>

<script>
import { getSession } from '../utils/auth.js'

export default {
  name: 'AdminPage',
  setup() {
    const session = getSession()
    return { session }
  }
}
</script>


