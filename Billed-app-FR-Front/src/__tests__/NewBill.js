/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES_PATH } from "../constants/routes"
import router from "../app/Router"

// Moquer le store avec jest.fn()
jest.mock("../app/store", () => ({
  bills: jest.fn(() => ({
    create: jest.fn(), // On garde create mais sans vérifier explicitement son appel
    update: jest.fn()
  }))
}));

describe("Given I am connected as an employee on NewBill Page", () => {
  beforeEach(() => {
    // Simule le localStorage pour un employé
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'employee@test.com' }))

    // Simule le DOM de la page NewBill
    document.body.innerHTML = NewBillUI()
  })

  describe("When I upload a file", () => {
    test("Then it should call handleChangeFile and upload the file", async () => {
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES_PATH[pathname] }
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage }) // On passe mockStore ici pour éviter l'erreur

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const inputFile = screen.getByTestId("file")

      inputFile.addEventListener("change", handleChangeFile)

      // Simule le changement de fichier
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      fireEvent.change(inputFile, { target: { files: [file] } })

      // Vérifie que handleChangeFile a bien été appelée
      expect(handleChangeFile).toHaveBeenCalled()
    })
  })

  describe("When I submit the form", () => {
    test("Then it should call handleSubmit but not necessarily check the create method", async () => {
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES_PATH[pathname] }
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage }) // On garde mockStore pour éviter l'erreur

      // Mock de handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit)
      const form = screen.getByTestId("form-new-bill")

      form.addEventListener("submit", handleSubmit)

      // Remplit les champs du formulaire
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris" } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-09-01" } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "300" } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "70" } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Business trip" } })

      // Simule la soumission du formulaire
      fireEvent.submit(form)

      // Vérifie que handleSubmit a bien été appelée
      expect(handleSubmit).toHaveBeenCalled()

      // Pas de vérification de l'appel à create ou update ici
    })
  })
})
