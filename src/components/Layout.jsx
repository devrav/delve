import {useAuth} from "@/contexts/AuthContext"
import {browserSupabase} from "@/utils/supabase/client"
import Head from "next/head"
import {useRouter} from "next/router"
import {Sidebar, SidebarProvider} from "@/components/ui/sidebar"
import {Home, FileText, LogOut} from "lucide-react"

export default function Layout({children}) {
  const {session} = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await browserSupabase.auth.signOut()
    router.push("/")
  }

  const sidebarItems = [
    {
      title: "Home",
      href: "/",
      icon: Home
    },
    {
      title: "Evidence",
      href: "/evidence/",
      icon: FileText
    }
  ]

  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <Head>
          <title>Delve</title>
          <meta name="description" content="Delve" />
        </Head>

        {session && (
          <Sidebar
            items={sidebarItems}
            userEmail={session?.user?.email}
            onSignOut={handleLogout}
            signOutIcon={LogOut}
          />
        )}

        <div className="flex-1 flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
        </div>

        <footer className="fixed bottom-0 w-full text-center text-sm text-gray-900 py-2 bg-gray-50">
          <p>
            Created by{" "}
            <a className="text-blue-800 underline" href="https://goyatg.com">
              Gourav Goyat
            </a>
          </p>
        </footer>
      </div>
    </SidebarProvider>
  )
}
