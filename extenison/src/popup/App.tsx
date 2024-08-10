const AppOr = () => {
  const getData = async () => {
    let response: any = await fetch('http://127.0.0.1:5000/upwork-gpt/us-central1/upworkGpt')
    response = await response.json()
  }
  return <button onClick={getData}>
    Click to hell
  </button>
}

export default AppOr