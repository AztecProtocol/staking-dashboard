// routes/AppRoutes.jsx
import { Route, Routes } from "react-router-dom"
import SharedLayout from "../layouts/SharedLayout"
import BaseLayout from "../layouts/BaseLayout"
import MinimalLayout from "../layouts/MinimalLayout"
import { MyPositionPage } from "../pages/ATP"
import { RegisterValidatorPage } from "../pages/RegisterValidator"
import { StakingProvidersPage, StakingProviderDetailPage } from "../pages/Providers"
import StakePortal from "@/pages/StakePortal/StakePortal"
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage"
import { GovernancePage } from "../pages/Governance"

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SharedLayout />}>
        <Route path="/" element={<MyPositionPage />} />
        <Route path="/providers" element={<StakingProvidersPage />} />
        <Route path="/providers/:id" element={<StakingProviderDetailPage />} />
        <Route path="/my-position" element={<MyPositionPage />} />
        <Route path="/stake" element={<StakePortal />} />
        <Route path="/register-validator" element={<RegisterValidatorPage />} />
      </Route>
      <Route element={<MinimalLayout />}>
        <Route path="/governance/:proposalId?" element={<GovernancePage />} />
      </Route>
      <Route element={<BaseLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
