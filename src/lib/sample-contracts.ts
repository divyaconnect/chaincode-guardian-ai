export interface SampleContract {
  id: string;
  name: string;
  tag: string;
  source: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: "reentrancy",
    name: "EtherBank",
    tag: "Reentrancy",
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EtherBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        balances[msg.sender] = 0;
    }

    function totalDeposits() external view returns (uint256) {
        return address(this).balance;
    }
}
`,
  },
  {
    id: "txorigin",
    name: "PhishableWallet",
    tag: "tx.origin + selfdestruct",
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PhishableWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function transfer(address payable to, uint256 amount) external {
        require(tx.origin == owner, "Not owner");
        to.transfer(amount);
    }

    function kill() external {
        selfdestruct(payable(msg.sender));
    }
}
`,
  },
  {
    id: "overflow",
    name: "LegacyToken",
    tag: "Integer overflow",
    source: `pragma solidity ^0.6.12;

contract LegacyToken {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    constructor(uint256 initial) public {
        balanceOf[msg.sender] = initial;
        totalSupply = initial;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] - value >= 0);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }

    function batchMint(address[] memory to, uint256 value) public {
        uint256 amount = to.length * value;
        totalSupply += amount;
        for (uint i = 0; i < to.length; i++) {
            balanceOf[to[i]] += value;
        }
    }
}
`,
  },
  {
    id: "lottery",
    name: "BlockLottery",
    tag: "Weak randomness",
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BlockLottery {
    address[] public players;

    function enter() external payable {
        require(msg.value == 0.1 ether, "Ticket is 0.1 ETH");
        players.push(msg.sender);
    }

    function pickWinner() external {
        uint256 idx = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length))
        ) % players.length;
        payable(players[idx]).send(address(this).balance);
        delete players;
    }
}
`,
  },
  {
    id: "secure",
    name: "SecureVault",
    tag: "Hardened",
    source: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureVault is ReentrancyGuard, Ownable {
    mapping(address => uint256) private _balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0, "Zero deposit");
        _balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        uint256 bal = _balances[msg.sender];
        require(amount > 0 && amount <= bal, "Invalid amount");
        _balances[msg.sender] = bal - amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _balances[user];
    }
}
`,
  },
];
