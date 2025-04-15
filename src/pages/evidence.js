import {CHECK_TYPES, CHECK_TYPES_DISPLAY} from "@/common/checks"
import Layout from "@/components/Layout"
import Link from "next/link"
import {toast} from "sonner"
import {collectEvidence, checkSupabaseIntegration} from "@/utils/apis"
import {useAuth} from "@/contexts/AuthContext"
import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import Login from "@/components/Login"
import Loader from "@/components/Loader"
import {getEvidenceForCheck} from "@/utils/apis"
import {useRouter} from "next/router"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {Skeleton} from "@/components/ui/skeleton"

const EvidenceTable = ({snapshot}) => {
  const {info, header, body} = snapshot
  const headerKeys = header.map(h => h[0])
  const headerValues = header.map(h => h[1])
  const colDisplay = val => {
    if (typeof val === "boolean") {
      return val ? "Yes" : "No"
    }
    return val || "--na--"
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{info}</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headerValues.map(h => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {body.map(row => (
              <TableRow key={row.id}>
                {headerKeys.map(key => (
                  <TableCell key={key}>{colDisplay(row[key])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const EvidenceCheck = ({session, check}) => {
  const [selectedTimestamp, setSelectedTimestamp] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [timestamps, setTimestamps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!check) return

    const fetchEvidence = async () => {
      setIsLoading(true)
      try {
        const {snapshot, timestamps, timestamp} = await getEvidenceForCheck(
          session,
          check,
          selectedTimestamp
        )
        if (!timestamps) {
          setError("No evidence found for this check")
        } else {
          setSnapshot(snapshot)
          setTimestamps(timestamps)
          setSelectedTimestamp(timestamp)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvidence()
  }, [check, selectedTimestamp, session])

  if (!timestamps) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">No evidence collected yet</h1>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-muted-foreground">
            Evidence for{" "}
            <span className="text-foreground">{CHECK_TYPES_DISPLAY[check]}</span>
          </h1>
          {timestamps.length > 0 && (
            <Select
              value={selectedTimestamp || ""}
              onValueChange={value => setSelectedTimestamp(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a timestamp" />
              </SelectTrigger>
              <SelectContent>
                {timestamps.map(timestamp => (
                  <SelectItem key={timestamp} value={timestamp}>
                    {new Date(timestamp).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : snapshot ? (
          <EvidenceTable snapshot={snapshot} />
        ) : (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold">No evidence found</h1>
              <p className="text-muted-foreground">Try selecting a different timestamp</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

const Evidence = ({session}) => {
  const [collectingEvidence, setCollectingEvidence] = useState(false)
  const [isSupabaseIntegrated, setIsSupabaseIntegrated] = useState(null)

  const checkIsSupabaseIntegrated = async () => {
    const isIntegrated = await checkSupabaseIntegration(session)
    setIsSupabaseIntegrated(isIntegrated)
  }

  useEffect(() => {
    checkIsSupabaseIntegrated()
  }, [])

  const handleCollectEvidence = async () => {
    setCollectingEvidence(true)
    await collectEvidence(session)
    toast.success("Evidence collected successfully")
    setCollectingEvidence(false)
  }

  if (isSupabaseIntegrated === false) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-6 p-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Supabase Integration Required
            </h2>
            <p className="text-muted-foreground">
              Please integrate Supabase to view and collect evidence
            </p>
          </div>
          <Link href="/">
            <Button variant="default">Go to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Collect and view evidence for different types of checks
          </p>

          <Button
            onClick={handleCollectEvidence}
            disabled={collectingEvidence}
            className="w-full sm:w-auto">
            {collectingEvidence ? "Collecting Evidence..." : "Collect Evidence"}
          </Button>

          <div className="space-y-2 mt-8">
            <h3 className="text-lg font-medium">
              Select a check to see the collected evidence
            </h3>
            <div className="flex flex-col gap-4">
              {Object.keys(CHECK_TYPES).map(check => (
                <Link key={check} href={`/evidence/?check=${check}`} className="block">
                  <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <p className="font-medium">{CHECK_TYPES_DISPLAY[check]}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function EvidenceHomeWrapper() {
  const {session, loading} = useAuth()
  const router = useRouter()
  if (loading) {
    return <Loader />
  }
  if (!session) {
    return <Login />
  }
  const {check} = router.query
  return check ? (
    <EvidenceCheck session={session} check={check} />
  ) : (
    <Evidence session={session} />
  )
}
