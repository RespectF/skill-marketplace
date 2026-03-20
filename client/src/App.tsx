import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import SkillDetail from "./pages/SkillDetail";
import CreateSkill from "./pages/CreateSkill";
import EditSkill from "./pages/EditSkill";
import MySkills from "./pages/MySkills";
import Profile from "./pages/Profile";
import BackToTop from "./components/BackToTop";
import RouteProgressBar from "./components/RouteProgressBar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/skill/:slug" component={SkillDetail} />
      <Route path="/edit/:id" component={EditSkill} />
      <Route path="/create" component={CreateSkill} />
      <Route path="/my-skills" component={MySkills} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <RouteProgressBar />
          <Router />
          <BackToTop />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
