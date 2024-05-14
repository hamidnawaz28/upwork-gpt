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

const upworkData = {
  budget: {
    name: 'budget',
    type: 'multi-select',
    data: ['0-99', '100-499', '500-999', '1000-4999', '5000-'],
  },
  clientHistoricalHires: {
    name: 'client_hires',
    type: 'multi-select',
    data: [
      // hostorical hiring from client
      '0',
      '1-9',
      '10-',
    ],
  },
  connectPrice: {
    name: 'connect_price',
    type: 'multi-select',
    data: ['0-4', '8', '12', '16'],
  },
  expereienceLevelRequired: {
    name: 'contractor_tier',
    type: 'multi-select',
    data: ['1', '2', '3'],
  },

  contract_to_hire: true,
  verified_payment_only: 1,
  previous_clients: 1, // verify

  projectDurations: {
    name: 'duration_v3',
    type: 'multi-select',
    data: ['week', 'month', 'semester', 'ongoing'],
  },

  hourlyRate: {
    name: 'hourly_rate',
    type: 'fields',
    data: {
      min: 1,
      max: 1000,
    },
  },

  location: {
    name: 'location',
    type: 'multi-select',
    data: [
      // complete list
      'Albania',
      'Australia+and+New+Zealand',
      'Africa',
    ],
  },

  noOfProposals: {
    name: 'proposals',
    type: 'multi-select',
    data: ['0-4', '5-9', '10-14', '15-19', '20-49'],
  },
  keywords: {
    // verify we can use multiple
    name: 'q',
    type: 'text-field',
    data: 'chrome+extension',
  },

  sort: {
    name: 'sort',
    type: 'single-select',
    data: [
      // add other options as well
      'recency', // prefered
      'relevance+desc',
      'client_total_charge',
      'client_rating+desc',
    ],
  },
  jobType: {
    name: 'job_type',
    type: 'multi-select',
    data: ['hourly', 'fixed'],
  },
  workload: {
    name: 'workload',
    type: 'multi-select',
    data: ['as_needed', 'part_time', 'full_time'],
  },

  pagingation: {
    name: 'paging',
    type: 'number-fields',
    data: [
      // verify the logic
      '0', // from 0%3B50 like 0;50
      '50', // to
    ],
  },

  timezone: {
    name: 'timezone',
    type: 'multi-select',
    data: [
      // complete list
      'Pacific/Midway',
      'Pacific/Honolulu',
    ],
  },

  api_params: 1,
  securityToken:
    '5534860065db8587ad93d99f828992a2630fd9dca29564c02b612cd1688a5fc3941cf6b85fc14d529dc4f2270de5d957d7b810dde33a2e9dd8d3e996f40aa0bc',
  userUid: '1124677144079728640',
  orgUid: '1124677144083922945',
}
