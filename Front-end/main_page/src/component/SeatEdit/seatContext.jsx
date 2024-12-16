import { createContext, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export const Seat = createContext({
  seats: [],
  seatData: {},
  selectedSeats: [],
  hall_id: undefined,
  GRID_SIZE: undefined,
  handleSelectSeats: () => {},
  handleRowSelect: () => {},
  handleClearSelect: () => {},
  selectAll: () => {},
  save_seats: () => {},
  setSeats: () => {},
  grade: undefined,
  handleChangeGrade: ()=>{},
  handleSubmitGrade: ()=>{},
});

export default function SeatProvider({ children, apiLoc }) {
  const hall_id = useParams().hall_id || undefined;
  const performance_id = useParams().performance_id || undefined;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatData, setSeatData] = useState({});
  const [seats, setSeats] = useState([]);
  const [grade, setGrade] = useState("");
  const GRID_SIZE = useRef(30);

  useEffect(() => {
    const fetchData = async () => {
      if (performance_id == undefined) {
        try {
          const response = await fetch(`/api/seat/getseat/${hall_id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setSeatData(data);
        } catch (error) {
          console.error("Error fetching seat data:", error);
        }
      }
      if (hall_id == undefined) {
        try {
          const response = await fetch(
            `/api/seat/getseatposition/${performance_id}`
          );
          const response2 = await fetch(
            `/api/seat/getseat/performance/${performance_id}`
          )
          const result = await response.json();
          const data = await response2.json();
          setSeatData(data);
          setSeats(result);
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchData();
  }, [hall_id]);

  useEffect(() => {
    if(hall_id!=undefined){
        setSeats(makeSeats);
    }
  }, [seatData]);

  useEffect(() => {
    const handleSelectAll = (e) => {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        selectAll();
      }
    };
    const handleClearAll = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClearSelect();
      }
    };
    window.addEventListener("keydown", handleSelectAll);
    window.addEventListener("keydown", handleClearAll);
    return () => {
      window.removeEventListener("keydown", handleSelectAll);
      window.removeEventListener("keydown", handleClearAll);
    };
  }, [selectAll, handleClearSelect]);

  function makeSeats() {
    let seatArray = [];

    for (let row in seatData) {
      for (let num = seatData[row][0]; num <= seatData[row][1]; num++) {
        seatArray.push({
          id: `${row}${num}`,
          position: getDefaultPosition(row, num),
          grade: "ALL",
        });
      }
    }
    return seatArray;
  }

  function getDefaultPosition(row, num) {
    let rowIndex = row.charCodeAt(0) - "A".charCodeAt(0);
    let x = (num - 1) * GRID_SIZE.current;
    let y = rowIndex * GRID_SIZE.current;
    return { x, y };
  }

  function handleSelectSeats(e, seatId) {
    if (e.ctrlKey) {
      if (selectedSeats.includes(seatId)) return;
      setSelectedSeats((prevSelectedSeats) => [...prevSelectedSeats, seatId]);
    }
    if (e.altKey) {
      setSelectedSeats((prevSelectedSeats) =>
        prevSelectedSeats.filter((id) => id !== seatId)
      );
    }
    if (selectedSeats.length > 0) {
      if (e.shiftKey) {
        let findFirstSeatById = seats.find(
          (seat) => seat.id === selectedSeats[0]
        );
        let firstPosition = findFirstSeatById.position;
        let findLastSeatById = seats.find((seat) => seat.id === seatId);
        let lastPosition = findLastSeatById.position;

        let grid_sizeX = GRID_SIZE.current;
        let grid_sizeY = GRID_SIZE.current;

        if (firstPosition.x > lastPosition.x) {
          grid_sizeX = -grid_sizeX;
        }
        if (firstPosition.y > lastPosition.y) {
          grid_sizeY = -grid_sizeY;
        }

        for (
          let py = firstPosition.y;
          grid_sizeY > 0 ? py <= lastPosition.y : py >= lastPosition.y;
          py += grid_sizeY
        ) {
          for (
            let px = firstPosition.x;
            grid_sizeX > 0 ? px <= lastPosition.x : px >= lastPosition.x;
            px += grid_sizeX / 2
          ) {
            let findPositions = seats.find(
              (seat) => seat.position.x == px && seat.position.y == py
            );
            if (findPositions != undefined) {
              setSelectedSeats((prevSelectedSeats) => [
                ...prevSelectedSeats,
                findPositions.id,
              ]);
            }
          }
        }
      }
    }
  }

  function handleRowSelect(e, row) {
    for (let num = seatData[row][0]; num <= seatData[row][1]; num++) {
      let id = `${row}${num}`;
      if (!selectedSeats.includes(id)) {
        setSelectedSeats((prevSelectedSeats) => [...prevSelectedSeats, id]);
      }
    }
  }

  function handleClearSelect() {
    setSelectedSeats([]);
  }

  function selectAll() {
    seats.map((seat) => {
      if (!selectedSeats.includes(seat.id))
        setSelectedSeats((prevSelectedSeats) => [
          ...prevSelectedSeats,
          seat.id,
        ]);
    });
  }

  const save_seats = async () => {
    console.log(JSON.stringify(seats));
    let uri= hall_id ? `/api/seat/saveposition/h/${hall_id}` : `/api/seat/saveposition/p/${performance_id}`;
    try {
      const response = await fetch(uri , {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(seats),
      });
      if (!response.ok) {
        throw new Error("서버 요청 실패!");
      }
      const result = await response.text();
      console.log("서버 응답 : " + result);
      alert("저장성공!");
    } catch (error) {
      console.log("에러발생 : " + error);
    }
  };

  function handleChangeGrade(e){
    setGrade(e.target.value.toUpperCase());
  }

  function handleSubmitGrade(){
    seats.map((seat)=>{
        if(selectedSeats.includes(seat.id)){
            seat["grade"] = grade;
            console.log(seat);
        }
    })
  }

  const seatCtx = {
    seats: seats,
    seatData: seatData,
    selectedSeats: selectedSeats,
    hall_id: hall_id,
    GRID_SIZE: GRID_SIZE.current,
    handleSelectSeats: handleSelectSeats,
    handleRowSelect: handleRowSelect,
    handleClearSelect: handleClearSelect,
    selectAll: selectAll,
    save_seats: save_seats,
    setSeats: setSeats,
    grade: grade,
    handleChangeGrade: handleChangeGrade,
    handleSubmitGrade: handleSubmitGrade,
  };

  return <Seat.Provider value={seatCtx}>{children}</Seat.Provider>;
}
