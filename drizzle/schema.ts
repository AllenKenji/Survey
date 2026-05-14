import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "surveyor", "supervisor"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Local credentials for standalone username/password authentication.
 * One credential row maps to exactly one user.
 */
export const localAuthCredentials = mysqlTable("localAuthCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 64 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LocalAuthCredential = typeof localAuthCredentials.$inferSelect;
export type InsertLocalAuthCredential = typeof localAuthCredentials.$inferInsert;

/**
 * Households table - stores basic household information
 */
export const households = mysqlTable("households", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location information
  barangay: varchar("barangay", { length: 255 }).notNull(),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  province: varchar("province", { length: 255 }).default("Cagayan").notNull(),
  
  // Head of family information
  headOfFamily: varchar("headOfFamily", { length: 255 }).notNull(),
  age: int("age"),
  civilStatus: varchar("civilStatus", { length: 100 }),
  occupation: varchar("occupation", { length: 255 }),
  education: varchar("education", { length: 255 }),
  monthlyIncome: decimal("monthlyIncome", { precision: 10, scale: 2 }),
  
  // GPS coordinates
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  
  // Program membership
  fourPsBeneficiary: boolean("fourPsBeneficiary").default(false),
  tupadBeneficiary: boolean("tupadBeneficiary").default(false),
  seniorCitizen: boolean("seniorCitizen").default(false),
  pwdMember: boolean("pwdMember").default(false),
  indigenousPeople: boolean("indigenousPeople").default(false),
  
  // Survey metadata
  surveyedBy: int("surveyedBy").references(() => users.id),
  surveyedAt: timestamp("surveyedAt").defaultNow().notNull(),
  verificationPhoto: text("verificationPhoto"), // S3 URL
  verificationPhotoKey: varchar("verificationPhotoKey", { length: 512 }), // S3 key
  
  // Status workflow
  status: mysqlEnum("status", ["draft", "submitted", "approved", "returned"]).default("submitted").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  returnReason: text("returnReason"), // Reason for returning the survey
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

/**
 * Survey responses table - stores detailed survey form data
 */
export const surveyResponses = mysqlTable("surveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull().references(() => households.id, { onDelete: "cascade" }),
  
  // Section A: Household Identification
  sectionA: json("sectionA").$type<{
    householdNumber?: string;
    dateOfInterview?: string;
    enumeratorName?: string;
    supervisorName?: string;
    houseNumber?: string;
    street?: string;
    purok?: string;
    zipCode?: string;
    respondentContactNumber?: string;
    respondentEmail?: string;
  }>(),
  
  // Section B: Household Roster
  sectionB: json("sectionB").$type<{
    headBirthDate?: string;
    members?: Array<{
      name: string;
      relationship: string;
      sex: string;
      age: number;
      civilStatus: string;
      education: string;
      occupation: string;
      registeredVoter?: boolean;  // Is this member a registered voter? (18+ years old)
    }>;
  }>(),
  
  // Section C: Housing Characteristics
  sectionC: json("sectionC").$type<{
    houseType?: string;           // dwelling type: concrete, semi-concrete, light materials, makeshift
    tenureStatus?: string;        // ownership: owned, rented, informal settler, shared, rent-free
    roofMaterial?: string;
    wallMaterial?: string;
    numberOfRooms?: number;
    waterSource?: string;         // piped, deep well, open well, spring, river, rain, bottled, others
    toiletFacility?: string;      // flush/water-sealed, septic tank, open pit, hanging toilet, none
    electricitySource?: string;   // metered electricity, solar, generator, kerosene/lamp, none
    cookingFuel?: string;         // LPG, charcoal, wood, electricity, others
  }>(),
  
  // Section D: Income and Livelihood (kept for backward compatibility)
  sectionD: json("sectionD").$type<{
    primaryIncomeSource?: string;
    monthlyIncome?: number;
    secondaryIncome?: string;
    hasLivelihoodProgram?: boolean;
    experiencedFoodShortage?: boolean;
  }>(),
  
  // Section E: Health and Nutrition
  sectionE: json("sectionE").$type<{
    hasHealthInsurance?: boolean;       // any health insurance (PhilHealth, private, etc.)
    healthInsuranceType?: string;       // PhilHealth, private, HMO, none
    hasPhilHealth?: boolean;            // specifically PhilHealth coverage
    philHealthType?: string;            // member type: employed, self-employed, indigent/sponsored, etc.
    hasChronicIllness?: boolean;
    chronicIllnessDetails?: string;
    hasDisabledMember?: boolean;
    disabilityDetails?: string;
    hasPregnantMember?: boolean;
    pregnantMemberAge?: string;
    childrenNutritionStatus?: string;   // normal, underweight, severely underweight, overweight
    childrenImmunized?: boolean;
    // CBMS Health Mortality & Nutrition Indicators
    childDeaths?: number;               // number of children under 5 who died in the past 12 months
    childDeathDetails?: string;         // cause of death / circumstances
    maternalDeaths?: number;            // number of women who died due to pregnancy-related causes in past 12 months
    maternalDeathDetails?: string;      // cause of death / circumstances
    malnourishedChildren?: number;      // number of children 0-5 who are malnourished (underweight/severely underweight)
    malnourishedChildrenDetails?: string; // names/ages of malnourished children
  }>(),
  
  // Section F: Education
  sectionF: json("sectionF").$type<{
    childrenInSchool?: number;              // children 6-11 attending elementary
    childrenOutOfSchool?: number;           // children 6-11 NOT attending school (CBMS indicator)
    youthInSchool?: number;                 // youth 12-15 attending high school
    youthOutOfSchool?: number;              // youth 12-15 NOT attending high school (CBMS indicator)
    reasonsForNotAttending?: string;
    hasInternetAccess?: boolean;
    digitalDevices?: string[];              // laptop, phone, tablet, etc.
    informationSources?: string[];          // radio, TV, internet, newspaper, etc.
  }>(),
  
  // Section G: Social Protection
  sectionG: json("sectionG").$type<{
    fourPsBeneficiary?: boolean;
    tupadBeneficiary?: boolean;
    magsakabataanRecipient?: boolean;
    soloParent?: boolean;
    otherPrograms?: string[];
  }>(),
  
  // Section H: Disaster Preparedness & Peace/Order
  sectionH: json("sectionH").$type<{
    hasEmergencyKit?: boolean;
    hasEvacuationPlan?: boolean;            // household has a family evacuation plan (CBMS indicator)
    evacuationCenterAccessible?: boolean;   // knows/can access nearest evacuation center
    disasterExperience?: string;            // type of disaster experienced in last 5 years
    memberOfCommunityOrg?: boolean;
    // CBMS Peace & Order Indicators
    victimOfCrime?: boolean;               // any household member was a victim of crime in past 12 months
    crimeTypes?: string[];                 // types of crime (theft, physical assault, robbery, etc.)
    maleVictims?: number;                  // number of male victims
    femaleVictims?: number;                // number of female victims
    crimeReported?: boolean;               // was the crime reported to authorities?
    reportedTo?: string;                   // barangay, police, DSWD, etc.
    crimeDetails?: string;                 // additional details
  }>(),
  
  // Section I: Agricultural Activities & Livelihood
  sectionI: json("sectionI").$type<{
    hasAgriculturalLand?: boolean;          // owns or tills agricultural land (CBMS indicator)
    landArea?: number;                      // in hectares
    cropsPlanted?: string[];
    hasLivestock?: boolean;
    livestockDetails?: string;
    hasBackyardGarden?: boolean;
    gardenDetails?: string;
    hasSavings?: boolean;
    hasLoanAccess?: boolean;
  }>(),
  
  // Section J: Access to Services
  sectionJ: json("sectionJ").$type<{
    distanceToHealthCenter?: number;
    distanceToSchool?: number;
    distanceToMarket?: number;
    transportationMode?: string;
  }>(),
  
  // Section K: Household Needs and Priorities
  sectionK: json("sectionK").$type<{
    primaryNeeds?: string[];
    priorityPrograms?: string[];
    additionalComments?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

/**
 * Custom report templates table - stores user-defined report configurations
 */
export const reportTemplates = mysqlTable("reportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Field selection - array of field names to include in the report
  selectedFields: json("selectedFields").$type<string[]>().notNull(),
  
  // Filter configuration
  filters: json("filters").$type<{
    barangay?: string[];
    municipality?: string[];
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
    minIncome?: number;
    maxIncome?: number;
    minAge?: number;
    maxAge?: number;
    fourPsBeneficiary?: boolean;
    tupadBeneficiary?: boolean;
    seniorCitizen?: boolean;
    pwdMember?: boolean;
    indigenousPeople?: boolean;
  }>(),
  
  // Created by user
  createdBy: int("createdBy").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

/**
 * Custom export layouts table - stores user-defined export format configurations
 */
export const exportLayouts = mysqlTable("exportLayouts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Layout type: 'executive', 'detailed', 'field', or 'custom'
  layoutType: varchar("layoutType", { length: 50 }).notNull(),
  
  // Format preferences
  preferences: json("preferences").$type<{
    includeCharts?: boolean;
    includeMetrics?: boolean;
    includeNarrative?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'A4' | 'Letter' | 'Legal';
    headerText?: string;
    footerText?: string;
    includeTimestamp?: boolean;
    includePageNumbers?: boolean;
  }>(),
  
  // Created by user
  createdBy: int("createdBy").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExportLayout = typeof exportLayouts.$inferSelect;
export type InsertExportLayout = typeof exportLayouts.$inferInsert;

/**
 * Report drafts table - stores shareable report configurations
 */
export const reportDrafts = mysqlTable("reportDrafts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Unique share token for generating shareable links
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  
  // Report configuration
  selectedFields: json("selectedFields").$type<string[]>().notNull(),
  filters: json("filters").$type<{
    barangay?: string;
    municipality?: string;
    status?: string;
    minIncome?: number;
    maxIncome?: number;
    minAge?: number;
    maxAge?: number;
    fourPsBeneficiary?: boolean;
    tupadBeneficiary?: boolean;
  }>(),
  
  // Layout selection (either predefined or custom layout ID)
  exportLayout: varchar("exportLayout", { length: 50 }).notNull(),
  customLayoutId: int("customLayoutId").references(() => exportLayouts.id),
  
  // Draft metadata
  isPublic: boolean("isPublic").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  lastViewedAt: timestamp("lastViewedAt"),
  
  // Created by user
  createdBy: int("createdBy").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportDraft = typeof reportDrafts.$inferSelect;
export type InsertReportDraft = typeof reportDrafts.$inferInsert;

/**
 * Draft comments table - stores comments on report drafts for team collaboration
 */
export const draftComments = mysqlTable("draftComments", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference to the draft
  draftId: int("draftId").references(() => reportDrafts.id, { onDelete: "cascade" }).notNull(),
  
  // Comment content
  content: text("content").notNull(),
  
  // Comment author
  authorId: int("authorId").references(() => users.id).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DraftComment = typeof draftComments.$inferSelect;
export type InsertDraftComment = typeof draftComments.$inferInsert;

/**
 * CBMS threshold configurations - stores per-indicator alert thresholds
 */
export const cbmsThresholds = mysqlTable("cbmsThresholds", {
  id: int("id").autoincrement().primaryKey(),

  // The indicator key (e.g. "belowPoverty", "informalSettlers")
  indicatorKey: varchar("indicatorKey", { length: 100 }).notNull().unique(),

  // Human-readable indicator name
  indicatorName: varchar("indicatorName", { length: 200 }).notNull(),

  // CBMS baseline percentage for this indicator
  baselinePct: decimal("baselinePct", { precision: 6, scale: 2 }).notNull(),

  // Alert fires when live % EXCEEDS baseline by this many percentage points
  warnThresholdPct: decimal("warnThresholdPct", { precision: 6, scale: 2 }).default("5.00").notNull(),

  // Alert fires at critical level when live % exceeds baseline by this many pp
  criticalThresholdPct: decimal("criticalThresholdPct", { precision: 6, scale: 2 }).default("10.00").notNull(),

  // Whether this threshold is active
  isActive: boolean("isActive").default(true).notNull(),

  // Who last updated this threshold
  updatedBy: int("updatedBy").references(() => users.id),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CbmsThreshold = typeof cbmsThresholds.$inferSelect;
export type InsertCbmsThreshold = typeof cbmsThresholds.$inferInsert;
