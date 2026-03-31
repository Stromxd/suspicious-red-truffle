import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";

export default function App() {
  const [activeTab, setActiveTab] = useState("A");

  const [partyA, setPartyA] = useState([]);
  const [partyB, setPartyB] = useState([]);

  const [sections, setSections] = useState([
    { title: "Section 6", data: [] },
    { title: "Section 10", data: [] },
    { title: "Section 15", data: [] },
    { title: "Section 20", data: [] },
    { title: "My Section", data: [] },
  ]);

  const [partyAName, setPartyAName] = useState("Party A");
  const [partyBName, setPartyBName] = useState("Party B");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await AsyncStorage.getItem("ledger");
    if (data) {
      const parsed = JSON.parse(data);

      setPartyA(parsed.partyA || []);
      setPartyB(parsed.partyB || []);

      if (Array.isArray(parsed.sections)) {
        setSections(parsed.sections);
      } else if (typeof parsed.sections === "object") {
        const converted = Object.keys(parsed.sections).map((key) => ({
          title: key,
          data: parsed.sections[key],
        }));
        setSections(converted);
      }

      setPartyAName(parsed.partyAName || "Party A");
      setPartyBName(parsed.partyBName || "Party B");
    }
  };

  useEffect(() => {
    saveData();
  }, [partyA, partyB, sections, partyAName, partyBName]);

  const saveData = async () => {
    await AsyncStorage.setItem(
      "ledger",
      JSON.stringify({
        partyA,
        partyB,
        sections,
        partyAName,
        partyBName,
      })
    );
  };

  const addRow = (setData) => {
    setData((prev) => [...prev, { name: "", purchase: "", sale: "" }]);
  };

  const deleteRow = (index, data, setData) => {
    const updated = data.filter((_, i) => i !== index);
    setData(updated);
  };

  const calculateTotal = (data, type) => {
    return data.reduce((sum, item) => sum + Number(item[type] || 0), 0);
  };

  // ✅ PDF EXPORT (NO ERROR)
  const exportToPDF = async () => {
    let html = `<html><body><h1 style="text-align:center;">Ledger Report</h1>`;

    html += `<h2>${partyAName}</h2><table border="1" width="100%">
    <tr><th>Name</th><th>Purchase</th><th>Sale</th></tr>`;

    partyA.forEach((item) => {
      html += `<tr><td>${item.name}</td><td>${item.purchase}</td><td>${item.sale}</td></tr>`;
    });

    html += `</table>`;

    html += `<h2>${partyBName}</h2><table border="1" width="100%">
    <tr><th>Name</th><th>Purchase</th><th>Sale</th></tr>`;

    partyB.forEach((item) => {
      html += `<tr><td>${item.name}</td><td>${item.purchase}</td><td>${item.sale}</td></tr>`;
    });

    html += `</table>`;

    sections.forEach((section) => {
      html += `<h2>${section.title}</h2><table border="1" width="100%">
      <tr><th>Name</th><th>Date</th><th>Amount</th></tr>`;

      section.data.forEach((item) => {
        html += `<tr><td>${item.name}</td><td>${item.date}</td><td>${item.amount}</td></tr>`;
      });

      html += `</table>`;
    });

    html += `</body></html>`;

    const { uri } = await Print.printToFileAsync({ html });

    Alert.alert("PDF Generated", "Saved at:\n" + uri);
  };

  const renderParty = (data, setData, title, setTitle) => (
    <ScrollView style={{ padding: 10 }}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <View style={{ flexDirection: "row", backgroundColor: "#ddd", padding: 5 }}>
        <Text style={{ flex: 2 }}>Name</Text>
        <Text style={{ flex: 1 }}>Purchase</Text>
        <Text style={{ flex: 1 }}>Sale</Text>
      </View>

      {data.map((item, index) => (
        <View key={index} style={{ flexDirection: "row", marginBottom: 5 }}>
          <TextInput
            value={item.name}
            placeholder="Name"
            onChangeText={(text) => {
              let newData = [...data];
              newData[index].name = text;
              setData(newData);
            }}
            style={{ flex: 2, borderWidth: 1 }}
          />

          <TextInput
            value={item.purchase}
            placeholder="Purchase"
            keyboardType="numeric"
            onChangeText={(text) => {
              let newData = [...data];
              newData[index].purchase = text;
              setData(newData);
            }}
            style={{ flex: 1, borderWidth: 1 }}
          />

          <TextInput
            value={item.sale}
            placeholder="Sale"
            keyboardType="numeric"
            onChangeText={(text) => {
              let newData = [...data];
              newData[index].sale = text;
              setData(newData);
            }}
            style={{ flex: 1, borderWidth: 1 }}
          />

          <TouchableOpacity onPress={() => deleteRow(index, data, setData)}>
            <Text style={{ color: "red" }}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button title="Add Row" onPress={() => addRow(setData)} />

      <Text>Total Purchase: ₹{calculateTotal(data, "purchase")}</Text>
      <Text>Total Sale: ₹{calculateTotal(data, "sale")}</Text>
    </ScrollView>
  );

  const renderSection = (section, secIndex) => (
    <View style={{ padding: 10 }}>
      <TextInput
        value={section.title}
        onChangeText={(text) => {
          let updated = [...sections];
          updated[secIndex].title = text;
          setSections(updated);
        }}
        style={{ borderWidth: 1, marginBottom: 5 }}
      />

      {section.data.map((item, index) => (
        <View key={index} style={{ flexDirection: "row", marginBottom: 5 }}>
          <TextInput
            placeholder="Name"
            value={item.name}
            onChangeText={(text) => {
              let updated = [...sections];
              updated[secIndex].data[index].name = text;
              setSections(updated);
            }}
            style={{ flex: 2, borderWidth: 1 }}
          />

          <TextInput
            placeholder="Date"
            value={item.date}
            onChangeText={(text) => {
              let updated = [...sections];
              updated[secIndex].data[index].date = text;
              setSections(updated);
            }}
            style={{ flex: 1.5, borderWidth: 1 }}
          />

          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={item.amount}
            onChangeText={(text) => {
              let updated = [...sections];
              updated[secIndex].data[index].amount = text;
              setSections(updated);
            }}
            style={{ flex: 1, borderWidth: 1 }}
          />
        </View>
      ))}

      <Button
        title="Add Entry"
        onPress={() => {
          let updated = [...sections];
          updated[secIndex].data.push({ name: "", date: "", amount: "" });
          setSections(updated);
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 30 }}>
        <Button title={partyAName} onPress={() => setActiveTab("A")} />
        <Button title={partyBName} onPress={() => setActiveTab("B")} />
        <Button title="Sections" onPress={() => setActiveTab("S")} />
      </View>

      <View style={{ padding: 20 }}>
      <Button title="Export PDF" onPress={exportToPDF} />
      </View>

      {activeTab === "A" &&
        renderParty(partyA, setPartyA, partyAName, setPartyAName)}

      {activeTab === "B" &&
        renderParty(partyB, setPartyB, partyBName, setPartyBName)}

      {activeTab === "S" && (
        <ScrollView>
          {sections.map((section, index) => (
            <View key={index}>{renderSection(section, index)}</View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}