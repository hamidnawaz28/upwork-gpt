// example
const rssString2 = `https://www.upwork.com/ab/feed/jobs/rss?
budget=0-99%2C100-499%2C500-999%2C1000-4999%2C5000-
&client_hires=0%2C1-9%2C10-
&connect_price=0-4%2C8%2C12%2C16
&contract_to_hire=true
&contractor_tier=1%2C2%2C3
&duration_v3=week%2Cmonth%2Csemester%2Congoing
&hourly_rate=1-10000
&location=Albania%2CAustralia+and+New+Zealand%2CAfrica%2CAmericas%2CAntarctica%2CAsia%2CEurope%2COceania
&verified_payment_only=1
&previous_clients=%2A
&proposals=0-4%2C5-9%2C10-14%2C15-19%2C20-49
&q=extension
&sort=recency
&job_type=hourly%2Cfixed
&timezone=Pacific/Midway%2CPacific/Honolulu%2CAmerica/Nome%2CAmerica/Los_Angeles%2CAsia/Bangkok%2CAustralia/Perth%2CAsia/Irkutsk%2CAsia/Shanghai%2CAsia/Tokyo%2CPacific/Guam%2CAsia/Vladivostok%2CAustralia/Hobart%2CAustralia/Darwin%2CAustralia/Sydney%2CAustralia/Brisbane%2CAustralia/Adelaide%2CAsia/Yakutsk%2CPacific/Fiji%2CPacific/Auckland%2CPacific/Kwajalein%2CAsia/Kamchatka%2CAsia/Magadan%2CPacific/Apia
&workload=as_needed%2Cpart_time%2Cfull_time
&paging=0%3B10
&api_params=1
&securityToken=5534860065db8587ad93d99f828992a2630fd9dca29564c02b612cd1688a5fc3941cf6b85fc14d529dc4f2270de5d957d7b810dde33a2e9dd8d3e996f40aa0bc
&userUid=1124677144079728640
&orgUid=1124677144083922945`

enum FieldType {
  SELECT,
  MULTISELECT,
  BOOLEAN,
  RANGE,
  TEXT,
}

const budget = {
  name: 'budget',
  label: 'Budget',
  type: FieldType.MULTISELECT,
  options: ['0-99', '100-499', '500-999', '1000-4999', '5000-'],
}

const clientHistoricalHires = {
  name: 'client_hires',
  label: 'Client Historical Hires',
  type: FieldType.MULTISELECT,
  options: ['0', '1-9', '10-'],
}

const connectPrice = {
  name: 'connect_price',
  label: 'Connect Price',
  type: FieldType.MULTISELECT,
  options: ['0-4', '8', '12', '16'],
}

const expereienceLevelRequired = {
  name: 'contractor_tier',
  label: 'Your level',
  type: FieldType.MULTISELECT,
  options: ['1', '2', '3'],
}

const projectDurations = {
  name: 'duration_v3',
  label: 'Project Duration',
  type: FieldType.MULTISELECT,
  options: ['week', 'month', 'semester', 'ongoing'],
}

const hourlyRate = {
  name: 'hourly_rate',
  label: 'Hourly Rate',
  type: FieldType.RANGE,
  range: {
    min: 1,
    max: 1000,
  },
}

const country = {
  name: 'location',
  label: 'Country',
  type: FieldType.MULTISELECT,
  options: [
    // complete list
    'Albania',
    'Australia+and+New+Zealand',
    'Africa',
  ],
}

const noOfProposals = {
  name: 'proposals',
  label: 'Proposals',
  type: FieldType.MULTISELECT,
  options: ['0-4', '5-9', '10-14', '15-19', '20-49'],
}

const keywords = {
  // verify we can use multiple
  name: 'q',
  label: 'Keywords',
  type: FieldType.TEXT,
  text: '',
}

const sort = {
  name: 'sort',
  label: 'Sort By',
  type: FieldType.SELECT,
  options: [
    // add other options as well
    'recency', // prefered
    'relevance+desc',
    'client_total_charge',
    'client_rating+desc',
  ],
}

const rateType = {
  name: 'job_type',
  label: 'Rate Type',
  type: FieldType.MULTISELECT,
  options: ['hourly', 'fixed'],
}

const jobType = {
  name: 'workload',
  label: 'Job Type',
  type: FieldType.MULTISELECT,
  options: ['as_needed', 'part_time', 'full_time'],
}

const pagingation = {
  name: 'paging',
  label: 'Pagination',
  type: FieldType.RANGE,
  range: [
    // verify the logic
    '0', // from 0%3B50 like 0;50
    '50', // to
  ],
}

const timezone = {
  name: 'timezone',
  label: 'Timezone',
  type: FieldType.MULTISELECT,
  options: [
    // complete list
    'Pacific/Midway',
    'Pacific/Honolulu',
  ],
}

const upworkData = {
  budget,
  clientHistoricalHires,
  connectPrice,
  expereienceLevelRequired,
  contract_to_hire: true,
  verified_payment_only: 1,
  previous_clients: 1, // verify
  projectDurations,
  hourlyRate,
  location: country,
  noOfProposals,
  keywords,
  sort,
  rateType,
  jobType,
  pagingation,
  timezone,
  api_params: 1,
  securityToken:
    '5534860065db8587ad93d99f828992a2630fd9dca29564c02b612cd1688a5fc3941cf6b85fc14d529dc4f2270de5d957d7b810dde33a2e9dd8d3e996f40aa0bc',
  userUid: '1124677144079728640',
  orgUid: '1124677144083922945',
}
