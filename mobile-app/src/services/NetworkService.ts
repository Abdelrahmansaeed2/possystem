import NetInfo from "@react-native-community/netinfo"

export class NetworkService {
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch()
      return (state.isConnected && state.isInternetReachable) || false
    } catch (error) {
      console.error("Error checking network status:", error)
      return false
    }
  }

  async waitForConnection(timeout = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now()

      const checkConnection = async () => {
        const connected = await this.isConnected()

        if (connected) {
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          resolve(false)
        } else {
          setTimeout(checkConnection, 1000)
        }
      }

      checkConnection()
    })
  }

  onConnectionChange(callback: (isConnected: boolean) => void) {
    return NetInfo.addEventListener((state) => {
      callback((state.isConnected && state.isInternetReachable) || false)
    })
  }
}
