/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {

  describe("When I am on Bills Page", () => {

    // Test pour vérifier que l'icône de facture est surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      await waitFor(() => screen.getByTestId('icon-window'))
      
      const windowIcon = screen.getByTestId('icon-window')
      
      // Vérification que l'icône a la classe 'active-icon' (à adapter selon ta classe réelle)
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    // Test pour vérifier que les factures sont triées de la plus récente à la plus ancienne
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Récupérer les dates affichées sous forme de texte
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)
      
      // Fonction de tri anti-chronologique (du plus récent au plus ancien)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      
      // Trier les dates récupérées
      const datesSorted = [...dates].sort(antiChrono)
      
      // Vérification que les dates affichées sont triées dans le même ordre que les dates triées
      expect(dates).toEqual(datesSorted)
    })

    // Test pour vérifier que lorsque je clique sur le bouton "New Bill", je suis redirigé vers la page de nouvelle facture
    test("When I click on New Bill button, I should be redirected to New Bill page", () => {
      const onNavigate = jest.fn(); // Mock de la fonction de navigation
      const billPage = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
      
      document.body.innerHTML = BillsUI({ data: bills })
      
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      const handleClickNewBill = jest.fn(billPage.handleClickNewBill);

      buttonNewBill.addEventListener('click', handleClickNewBill);
      fireEvent.click(buttonNewBill);

      expect(handleClickNewBill).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    })

    // Test pour vérifier que lorsque je clique sur l'icône "œil", une modale s'affiche avec l'image de la facture
    test("When I click on the eye icon, a modal should open with the bill image", () => {
      $.fn.modal = jest.fn(); // Mock de la fonction modale de jQuery

      const billPage = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
      
      document.body.innerHTML = BillsUI({ data: bills })
      
      const iconEye = screen.getAllByTestId('icon-eye')[0];
      
      const handleClickIconEye = jest.fn(() => billPage.handleClickIconEye(iconEye));
      iconEye.addEventListener('click', handleClickIconEye);
      fireEvent.click(iconEye);

      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled(); // Vérifie que la modale est bien affichée
    })

    // Test pour vérifier que les factures sont bien récupérées depuis le store
    test("getBills should fetch bills from the store and display them", async () => {
      const storeMock = {
        bills: jest.fn(() => ({
          list: jest.fn().mockResolvedValueOnce(bills)
        }))
      };

      const billPage = new Bills({ document, onNavigate, store: storeMock, localStorage: window.localStorage });

      const fetchedBills = await billPage.getBills();
      
      expect(storeMock.bills).toHaveBeenCalled();
      expect(fetchedBills.length).toBe(bills.length);
    })
    
  })
})
