import {useEffect, useState} from "react"
import {useAuth} from "@/contexts/AuthContext"
import {toast} from "sonner"
import {useRouter} from "next/router"
import Login from "@/components/Login"
import {
  checkSupabaseIntegration,
  getSupabaseProjects,
  getSupabaseTables,
  getSupabaseUsers,
  refreshSupabaseData,
  integrateSupabase,
  removeSupabaseIntegration
} from "@/utils/apis"
import Layout from "@/components/Layout"
import {CHECK_TYPES, CHECK_TYPES_DISPLAY} from "@/common/checks"
import {Button} from "@/components/ui/button.jsx"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table.jsx"
import Loader from "@/components/Loader"

const Tabs = ({tabs, activeTab, setActiveTab}) => {
  return (
    <div className="flex gap-2">
      {tabs.map(tab => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? "default" : "outline"}
          onClick={() => setActiveTab(tab.key)}>
          {tab.name}
        </Button>
      ))}
    </div>
  )
}

const ProjectsList = ({projects = []}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>PITR Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map(project => (
          <TableRow key={project.id}>
            <TableCell>{project.name}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  project.pitr_enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                {project.pitr_enabled ? "Enabled" : "Disabled"}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const UsersList = ({users = []}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>MFA Status</TableHead>
          <TableHead>Project</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.email || "N/A"}</TableCell>
            <TableCell>{user.phone || "N/A"}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.mfa_enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                {user.mfa_enabled ? "Enabled" : "Disabled"}
              </span>
            </TableCell>
            <TableCell>{user.project_name || "N/A"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const TablesList = ({tables = []}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>RLS Status</TableHead>
          <TableHead>Project</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tables.map(table => (
          <TableRow key={table.id}>
            <TableCell>{table.name}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  table.rls_enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                {table.rls_enabled ? "Enabled" : "Disabled"}
              </span>
            </TableCell>
            <TableCell>{table.project_name || "N/A"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const Overview = ({projects, users, tables}) => {
  const totalProjects = projects.length
  const pitrEnabledProjects = projects.filter(project => project.pitr_enabled).length
  const totalUsers = users.length
  const mfaEnabledUsers = users.filter(user => user.mfa_enabled).length
  const totalTables = tables.length
  const rlsEnabledTables = tables.filter(table => table.rls_enabled).length
  const FailingCheckInfo = ({check_type, total, passing}) => {
    return (
      <div className="flex items-center justify-between p-4 mb-4 bg-gray-50 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-medium text-gray-900">
            {CHECK_TYPES_DISPLAY[check_type]}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {passing} / {total} passing
          </div>
          <div
            className={`h-2.5 w-24 rounded-full ${
              passing === total ? "bg-green-500" : "bg-red-500"
            }`}>
            <div
              className="h-2.5 rounded-full bg-green-500"
              style={{width: `${(passing / total) * 100}%`}}
            />
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="text-xl font-semibold text-gray-900 my-6">
        Overview of the checks applicable for Supabase
      </div>
      <FailingCheckInfo
        check_type={CHECK_TYPES.PROJECT_PITR_ENABLED}
        total={totalProjects}
        passing={pitrEnabledProjects}
      />
      <FailingCheckInfo
        check_type={CHECK_TYPES.USER_MFA_ENABLED}
        total={totalUsers}
        passing={mfaEnabledUsers}
      />
      <FailingCheckInfo
        check_type={CHECK_TYPES.TABLE_RLS_ENABLED}
        total={totalTables}
        passing={rlsEnabledTables}
      />
    </>
  )
}

const Home = ({session}) => {
  const router = useRouter()
  const {tab = "overview"} = router.query
  const [projectsData, setProjectsData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [tablesData, setTablesData] = useState([])
  const [refreshingData, setRefreshingData] = useState(false)
  const [integratingSupabase, setIntegratingSupabase] = useState(false)
  const [removingIntegration, setRemovingIntegration] = useState(false)
  const [isSupabaseIntegrated, setIsSupabaseIntegrated] = useState(null)
  const [supabaseAccessToken, setSupabaseAccessToken] = useState()
  const tabs = [
    {key: "overview", name: "Overview"},
    {key: "projects", name: "Projects"},
    {key: "users", name: "Users"},
    {key: "tables", name: "Tables"}
  ]

  const handleTabChange = newTab => {
    router.push(
      {
        pathname: router.pathname,
        query: {...router.query, tab: newTab}
      },
      undefined,
      {shallow: true}
    )
  }

  const getSupabaseData = async () => {
    try {
      const [users, tables, projects] = await Promise.all([
        getSupabaseUsers(session),
        getSupabaseTables(session),
        getSupabaseProjects(session)
      ])

      if (users?.length > 0) setUsersData(users)
      if (tables?.length > 0) setTablesData(tables)
      if (projects?.length > 0) setProjectsData(projects)
    } catch (error) {
      toast.error("Failed to fetch Supabase data")
    }
  }

  const checkIsSupabaseIntegrated = async () => {
    const isIntegrated = await checkSupabaseIntegration(session)
    setIsSupabaseIntegrated(isIntegrated)
  }

  useEffect(() => {
    checkIsSupabaseIntegrated()
    getSupabaseData()
  }, [])

  const handleRefreshData = async () => {
    setRefreshingData(true)
    try {
      const data = await refreshSupabaseData(session)
      toast.success(data.message)
      await getSupabaseData()
    } catch (error) {
      toast.error("Failed to refresh Supabase data")
    } finally {
      setRefreshingData(false)
    }
  }

  const handleIntegrateSupabase = async e => {
    e.preventDefault()
    if (!supabaseAccessToken) {
      toast.error("Please provide your Supabase access token")
      return
    }
    setIntegratingSupabase(true)
    try {
      const data = await integrateSupabase(session, supabaseAccessToken)
      toast.success(data.message)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to integrate Supabase")
    } finally {
      setIntegratingSupabase(false)
    }
  }

  const handleRemoveIntegration = async e => {
    e.preventDefault()
    setRemovingIntegration(true)
    try {
      const data = await removeSupabaseIntegration(session)
      toast.success(data.message)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to remove integration")
    } finally {
      setRemovingIntegration(false)
    }
  }

  if (isSupabaseIntegrated === null) {
    return <Loader />
  }

  if (isSupabaseIntegrated === false) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-6 p-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Integrate Supabase</h2>
            <p className="text-muted-foreground">
              Paste your Supabase access token below to get started
            </p>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Generate a new access token from{" "}
            <a
              href="https://supabase.com/dashboard/account/tokens"
              target="_blank"
              className="font-medium text-primary hover:underline">
              Supabase Dashboard
            </a>
          </div>

          <form onSubmit={handleIntegrateSupabase} className="w-full space-y-4">
            <input
              type="password"
              placeholder="Paste your Supabase access token"
              value={supabaseAccessToken}
              onChange={e => setSupabaseAccessToken(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" className="w-full" disabled={integratingSupabase}>
              {integratingSupabase ? "Integrating..." : "Integrate Supabase"}
            </Button>
          </form>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-lg font-bold">Supabase is integrated</p>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleRefreshData}
              disabled={refreshingData}
              className="min-w-[120px]">
              {refreshingData ? "Refreshing..." : "Refresh data"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveIntegration}
              disabled={removingIntegration}
              className="min-w-[120px]">
              {removingIntegration ? "Removing..." : "Remove Integration"}
            </Button>
          </div>
        </div>
        <Tabs tabs={tabs} activeTab={tab} setActiveTab={handleTabChange} />
        {tab === "overview" && (
          <Overview projects={projectsData} users={usersData} tables={tablesData} />
        )}
        {tab === "projects" && <ProjectsList projects={projectsData} />}
        {tab === "users" && <UsersList users={usersData} />}
        {tab === "tables" && <TablesList tables={tablesData} />}
      </div>
    </Layout>
  )
}

export default function HomeWrapper() {
  const {session, loading} = useAuth()

  if (loading) {
    return <Loader />
  }

  return session ? <Home session={session} /> : <Login />
}
