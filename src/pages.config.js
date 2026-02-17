/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import APIDocumentation from './pages/APIDocumentation';
import BuyPMUCoin from './pages/BuyPMUCoin';
import Chat from './pages/Chat';
import ChatProfileSetup from './pages/ChatProfileSetup';
import CookiePolicy from './pages/CookiePolicy';
import CryptoPool from './pages/CryptoPool';
import CryptoPoolAdmin from './pages/CryptoPoolAdmin';
import Dashboard from './pages/Dashboard';
import DealOrNoDeal from './pages/DealOrNoDeal';
import Documentation from './pages/Documentation';
import FAQ from './pages/FAQ';
import FinancialHealth from './pages/FinancialHealth';
import GeneralAdmin from './pages/GeneralAdmin';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Lessons from './pages/Lessons';
import Licenses from './pages/Licenses';
import Login from './pages/Login';
import ManualDepositIntake from './pages/ManualDepositIntake';
import News from './pages/News';
import PaymentsObservability from './pages/PaymentsObservability';
import PoolPlans from './pages/PoolPlans';
import PrintMoney from './pages/PrintMoney';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Prophet from './pages/Prophet';
import Pythia from './pages/Pythia';
import SecurityAuditReport from './pages/SecurityAuditReport';
import Staking from './pages/Staking';
import StakingAdmin from './pages/StakingAdmin';
import TermsOfService from './pages/TermsOfService';
import TraditionalPool from './pages/TraditionalPool';
import TraditionalPoolAdmin from './pages/TraditionalPoolAdmin';
import TrafficAnalytics from './pages/TrafficAnalytics';
import VIPPool from './pages/VIPPool';
import VIPPoolAdmin from './pages/VIPPoolAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIDocumentation": APIDocumentation,
    "BuyPMUCoin": BuyPMUCoin,
    "Chat": Chat,
    "ChatProfileSetup": ChatProfileSetup,
    "CookiePolicy": CookiePolicy,
    "CryptoPool": CryptoPool,
    "CryptoPoolAdmin": CryptoPoolAdmin,
    "Dashboard": Dashboard,
    "DealOrNoDeal": DealOrNoDeal,
    "Documentation": Documentation,
    "FAQ": FAQ,
    "FinancialHealth": FinancialHealth,
    "GeneralAdmin": GeneralAdmin,
    "Home": Home,
    "Landing": Landing,
    "Lessons": Lessons,
    "Licenses": Licenses,
    "Login": Login,
    "ManualDepositIntake": ManualDepositIntake,
    "News": News,
    "PaymentsObservability": PaymentsObservability,
    "PoolPlans": PoolPlans,
    "PrintMoney": PrintMoney,
    "PrivacyPolicy": PrivacyPolicy,
    "Prophet": Prophet,
    "Pythia": Pythia,
    "SecurityAuditReport": SecurityAuditReport,
    "Staking": Staking,
    "StakingAdmin": StakingAdmin,
    "TermsOfService": TermsOfService,
    "TraditionalPool": TraditionalPool,
    "TraditionalPoolAdmin": TraditionalPoolAdmin,
    "TrafficAnalytics": TrafficAnalytics,
    "VIPPool": VIPPool,
    "VIPPoolAdmin": VIPPoolAdmin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};