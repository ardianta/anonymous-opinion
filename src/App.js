import { ethers } from "ethers";
import * as React from "react";
import "./App.css";
import abi from "./utils/WavePortal.json";

import { formatDistance, subDays } from 'date-fns'

export default function App() {
  const contractAddress = "0x6a30855CA4caF1e71F437d90106ec5FBc36a68a2";
  const contractABI = abi.abi;

  const [currentAccount, setCurrentAccount] = React.useState("");
  const [allWaves, setAllWaves] = React.useState([]);
  const [message, setMessage] = React.useState("");

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have Metamask!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Chack if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if(!ethereum){
        alert("No wallet installed, get Metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // cal the getAllWaves method form your smartcontract
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        console.log(waves);
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // Execute the actual wave from your smart contract
        console.log(message);
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
    console.log(message);
  } 

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <header className="mb-5">
          <h1 className="h1">Anonymous Opinion!</h1>
          <p className="lead">
            Post your opinion anonymously and freedom ✊
          </p>
        </header>

        {currentAccount && (
          <div>
          <form onSubmit={wave}>
            <div className="mb-3">
              <label for="message">What in your mind?</label>
              <textarea className="form-control" rows="3" placeholder="Write your opinion..." 
              onChange={handleMessageChange} required>{message}</textarea>
            </div>

            <button className="btn btn-primary" onClick={wave}>
              Publish
            </button>
          </form>
          </div>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>Connect Wallet</button>
        )}

          <div className="my-5">
          <h2>Recent Opinions..</h2>
            {allWaves.map((wave, index) => {
              return(
                <div key={index} className="card my-3">
                  <div className="card-header small text-primary">
                    <div className="">{wave.address}</div>
                  </div>
                  <div className="card-body">
                    <p class="lead">{wave.message}</p>
                    <time className="small text-muted">{ formatDistance(new Date(wave.timestamp.toString()), new Date()) }</time>
                  </div>  
                </div>  
              )
            })}
          </div>
      </div>
    </div>
  );
}
