// BlackjackGame.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import deployedContracts from "../../contracts/deployedContracts";
import { styles } from "../../styles/BlackJackGameStyles";
import { calculateTotal, createDeck } from "../../utils/cardUtils";
import Hand from "../Blackjack/Hand";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { WriteOnlyFunctionForm } from "~~/app/debug/_components/contract";
import { randamu } from "~~/randmu";

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

// BlackjackGame.tsx

const BlackjackGame: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useAccount();

  const [deck, setDeck] = useState(createDeck());
  const [playerHand, setPlayerHand] = useState<{ value: string; suit: string }[]>([]);
  const [dealerHand, setDealerHand] = useState<{ value: string; suit: string }[]>([]);
  const [gameOver, setGameOver] = useState(true);
  const [message, setMessage] = useState("");
  const [userBalance, setUserBalance] = useState(1000);
  const [, setDealerBalance] = useState(1000000);
  const [bet, setBet] = useState<string>("");
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [isDealerDrawing, setIsDealerDrawing] = useState(false);

  const { address: userAddress } = useAccount();
  const blackJackContractInfo = deployedContracts[31337].Blackjack;
  const tokenContractInfo = deployedContracts[31337].DumbERC20;
  const blackJackContractAddress = blackJackContractInfo.address as Address;
  const blackJackContractABI = blackJackContractInfo.abi;
  const tokenContractAddress = tokenContractInfo.address as Address;
  const tokenContractABI = tokenContractInfo.abi;
  const approveABI = tokenContractABI.find(fn => fn.type === "function" && fn.name === "approve");
  const initiateGameABI = blackJackContractABI.find(fn => fn.type === "function" && fn.name === "initiateGame");
  const executeActionABI = blackJackContractABI.find(fn => fn.type === "function" && fn.name === "executeAction");

  const [needsApproval, setNeedsApproval] = useState(true);

  const initialFormValuesApprove = {
    _spender: blackJackContractAddress,
    _value: BigInt(bet) * BigInt(10 ** 18),
  };

  const initialFormValuesInitiate = {
    _betAmount: BigInt(bet) * BigInt(10 ** 18),
  };
  const { data: allowanceData } = useReadContract({
    address: tokenContractAddress,
    abi: tokenContractABI,
    functionName: "allowance",
    chainId: randamu.id,
    args: [userAddress || "", blackJackContractAddress],
  });

  const { data: userNonce } = useReadContract({
    address: blackJackContractAddress,
    abi: blackJackContractABI,
    functionName: "nonces",
    chainId: randamu.id,
    args: [userAddress || ""],
  });

  const initialFormValuesHit = {
    gameNonce: userNonce,
    action: 0,
  };

  const initialFormValuesStand = {
    gameNonce: userNonce,
    action: 1,
  };

  useEffect(() => {
    const betAmountBigInt = BigInt(bet);
    if (allowanceData !== undefined && allowanceData < betAmountBigInt) {
      setNeedsApproval(true);
    } else {
      setNeedsApproval(false);
    }
  }, [allowanceData, bet]);

  const val = parseFloat(bet);
  useEffect(() => {
    setPlayerTotal(calculateTotal(playerHand));
  }, [playerHand]);

  useEffect(() => {
    setDealerTotal(calculateTotal(dealerHand));
  }, [dealerHand]);

  const handleBetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBet(event.target.value);
  };

  const startGame = () => {
    if (userBalance < val) {
      setMessage("You don't have enough money to place this bet!");
      return;
    }

    if (val < 0) {
      setMessage("Invalid bet");
      return;
    }

    if (Number.isNaN(val)) {
      setMessage("Enter a bet");
      return;
    }

    setUserBalance(prev => prev - val);
    setDealerBalance(prev => prev + val);

    let deckCopy = [...deck];
    if (deckCopy.length < 10) {
      deckCopy = createDeck();
      setMessage("Deck is reshuffled!");
    }

    const newPlayerHand = [deckCopy.pop()!, deckCopy.pop()!];
    const newDealerHand = [deckCopy.pop()!, deckCopy.pop()!];

    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setDeck(deckCopy);
    setGameOver(false);
    setMessage("");
  };

  const startNextHand = () => {
    if (userBalance < val) {
      setMessage("You don't have enough funds to cover the bet!");
      return;
    }
    startGame();
  };

  const handleBack = () => {
    router.push("/");
  };

  const playerHit = () => {
    if (deck.length === 0) {
      setMessage("No more cards in the deck!");
      return;
    }

    const deckCopy = [...deck];
    const newPlayerHand = [...playerHand, deckCopy.pop()!];
    setPlayerHand(newPlayerHand);
    setDeck(deckCopy);

    const newTotal = calculateTotal(newPlayerHand);
    if (newTotal > 21) {
      setGameOver(true);
      setMessage("You bust! Dealer wins.");
      handleLoss();
    } else if (newTotal === 21) {
      setGameOver(true);
      setMessage("You hit 21! You win!");
      handleWin(newTotal);
    }
  };

  const playerStand = async () => {
    setIsDealerDrawing(true);
    const deckCopy = [...deck];
    const newDealerHand = [...dealerHand];

    while (calculateTotal(newDealerHand) < 17 && deckCopy.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newCard = deckCopy.pop()!;
      newDealerHand.push(newCard);
      setDealerHand([...newDealerHand]);
      setDeck(deckCopy);
    }

    setIsDealerDrawing(false);

    const currentPlayerTotal = calculateTotal(playerHand);
    const currentDealerTotal = calculateTotal(newDealerHand);

    if (currentDealerTotal > 21) {
      setMessage("Dealer busts! You win!");
      handleWin(currentPlayerTotal);
    } else if (currentPlayerTotal > currentDealerTotal) {
      setMessage("You win!");
      handleWin(currentPlayerTotal);
    } else if (currentDealerTotal > currentPlayerTotal) {
      setMessage("Dealer wins.");
      handleLoss();
    } else {
      setMessage("It’s a tie!");
      setUserBalance(prev => prev + val);
      setDealerBalance(prev => prev - val);
    }

    setGameOver(true);
  };

  const handleWin = (playerTotal: number) => {
    let winnings = val;
    if (playerTotal === 21) {
      winnings = val * 2;
    } else {
      winnings = val * 1.5;
    }

    setUserBalance(prev => prev + winnings);
    setDealerBalance(prev => prev - winnings);
  };

  const handleLoss = () => {
    //
  };

  const calculateVisibleDealerTotal = () => {
    if (gameOver) {
      return dealerTotal;
    } else {
      return calculateTotal([dealerHand[1]]);
    }
  };

  const changeBet = (newBet: number) => {
    setBet(newBet.toString());
  };

  return (
    <div style={styles.container}>
      <div style={styles.connectKitContainer}>
        <ConnectButton />
      </div>
      <h1 style={styles.header}>Blackjack</h1>
      <div style={styles.balanceContainer}>
        <h2 style={styles.balanceText}>Your Balance: ${userBalance}</h2>
        <h3 style={styles.playerTotalText}>Player Total: {playerTotal}</h3>
        <h3 style={styles.dealerTotalText}>Dealer Total: {calculateVisibleDealerTotal()}</h3>
        <div>
          <h3 style={styles.playerTotalText}>Bet: {bet}</h3>
        </div>
        {gameOver && playerHand.length === 0 && (
          <div style={styles.betContainer}>
            <label htmlFor="bet" style={styles.betLabel}>
              Place Your Bet:
            </label>
            <input
              id="bet"
              type="number"
              value={bet}
              onChange={handleBetChange}
              disabled={!gameOver}
              style={styles.betInput}
            />
          </div>
        )}
      </div>

      {/* <button
            style={{
              ...styles.startButton,
              backgroundColor: isConnected ? "#4CAF50" : "#808080",
              cursor: isConnected ? "pointer" : "not-allowed",
            }}
            onClick={startGame}
            disabled={!isConnected || userBalance < val}
            title={isConnected ? "Start the game" : "Connect your wallet to start the game"}
          >
            Start Game
          </button> */}
      {gameOver && playerHand.length === 0 && (
        <>
          <div>
            {approveABI && needsApproval ? (
              <>
                <h1>Approve</h1>
                <WriteOnlyFunctionForm
                  abi={tokenContractABI}
                  abiFunction={approveABI}
                  contractAddress={tokenContractAddress}
                  initialFormValues={initialFormValuesApprove}
                  hideFunctionInputs={true}
                  onChange={() => {
                    //
                  }}
                />
              </>
            ) : (
              <>
                <h1>Start Game</h1>
                {initiateGameABI && (
                  <WriteOnlyFunctionForm
                    abi={blackJackContractABI}
                    abiFunction={initiateGameABI}
                    contractAddress={blackJackContractAddress}
                    initialFormValues={initialFormValuesInitiate}
                    hideFunctionInputs={true}
                    onChange={() => {
                      startGame();
                    }}
                  />
                )}
              </>
            )}
          </div>

          <button onClick={handleBack} style={styles.backButton}>
            Back to Home
          </button>
          {message && <h3 style={styles.message}>{message}</h3>}
        </>
      )}

      {!gameOver && (
        <div style={styles.gameContainer}>
          <div style={styles.handsContainer}>
            <Hand hand={playerHand} title="Player Hand" />
            <Hand hand={dealerHand} title="Dealer Hand" hidden={!gameOver} />
          </div>
          <div style={styles.actionButtonsContainer}>
            {executeActionABI && (
              <>
                <WriteOnlyFunctionForm
                  abi={blackJackContractABI}
                  abiFunction={executeActionABI}
                  contractAddress={blackJackContractAddress}
                  initialFormValues={initialFormValuesHit}
                  hideFunctionInputs={true}
                  onChange={() => {
                    playerHit();
                  }}
                />
                <WriteOnlyFunctionForm
                  abi={blackJackContractABI}
                  abiFunction={executeActionABI}
                  contractAddress={blackJackContractAddress}
                  initialFormValues={initialFormValuesStand}
                  hideFunctionInputs={true}
                  onChange={() => {
                    playerStand();
                  }}
                />
              </>
            )}
          </div>
          {message && <h3 style={styles.message}>{message}</h3>}
        </div>
      )}

      {gameOver && playerHand.length > 0 && (
        <div style={styles.gameContainer}>
          <div style={styles.handsContainer}>
            <Hand hand={playerHand} title="Player Hand" />
            <Hand hand={dealerHand} title="Dealer Hand" hidden={false} />
          </div>
          {message && <h3 style={styles.message}>{message}</h3>}
          <button onClick={startNextHand} style={styles.startButton} disabled={userBalance < val}>
            Next Hand
          </button>

          <input
            id="bet"
            type="number"
            onChange={e => changeBet(parseFloat(e.target.value))}
            disabled={!gameOver}
            style={styles.betInputLarge}
            placeholder="Enter new bet"
          ></input>

          <button onClick={handleBack} style={styles.backButton}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default BlackjackGame;
